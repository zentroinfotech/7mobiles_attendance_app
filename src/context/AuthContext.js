import React, { createContext, useState, useContext, useEffect } from 'react';
import { storage } from '../utils/storage';
import api, { onUnauthorized } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/staff/stats');
      if (response.data.success) {
        setDashboardData(response.data);
        await storage.saveDashboardData(response.data);
        if (response.data.user) {
          setUser(response.data.user);
          await storage.saveUser(response.data.user);
        }
        return response.data;
      }
    } catch (error) {
      console.error('Error pre-fetching stats:', error);
    }
    return null;
  };

  useEffect(() => {
    // 1. Listen for global 401/403 errors
    const unsubscribe = onUnauthorized(() => {
      signOut();
    });

    const loadData = async () => {
      try {
        const token = await storage.getToken();
        const userData = await storage.getUser();
        const cachedDashboard = await storage.getDashboardData();
        
        if (cachedDashboard) {
          setDashboardData(cachedDashboard);
        }

        if (token) {
          // Verify token and pre-fetch dashboard data in parallel
          try {
            const [authResponse, statsResponse] = await Promise.all([
              api.get('/staff/check-auth'),
              api.get('/staff/stats').catch(err => ({ data: { success: false } }))
            ]);

            if (authResponse.data.success) {
              setUserToken(token);
              const latestUser = authResponse.data.user || userData;
              setUser(latestUser);
              if (authResponse.data.user) {
                await storage.saveUser(latestUser);
              }
              
              if (statsResponse.data.success) {
                setDashboardData(statsResponse.data);
                await storage.saveDashboardData(statsResponse.data);
                if (statsResponse.data.user) {
                  setUser(statsResponse.data.user);
                  await storage.saveUser(statsResponse.data.user);
                }
              }
            } else {
              await signOut();
            }
          } catch (apiError) {
            console.error('Initial data fetch failed:', apiError.message);
            if (apiError.response?.status === 401 || apiError.response?.status === 403) {
              setUserToken(null);
              setUser(null);
            } else {
              setUserToken(token);
              setUser(userData);
            }
          }
        }
      } catch (e) {
        console.error('Failed to load auth data', e);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();

    return () => unsubscribe();
  }, []);

  const signIn = async (token, userData) => {
    await storage.saveToken(token);
    await storage.saveUser(userData);
    setUserToken(token);
    setUser(userData);
    // Fetch dashboard data immediately after sign in
    fetchDashboardData();
  };

  const signOut = async () => {
    try {
      console.log('Starting signout process...');
      await storage.clearAll();
      setUserToken(null);
      setUser(null);
      setDashboardData(null);
      console.log('Signout successful');
    } catch (e) {
      console.error('Failed to clear storage during signout', e);
    }
  };

  const updateUser = async (updatedData) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    await storage.saveUser(newUser);
  };

  return (
    <AuthContext.Provider value={{ userToken, user, isLoading, dashboardData, fetchDashboardData, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
