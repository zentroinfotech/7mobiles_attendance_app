import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Alert,
  Modal,
  ActivityIndicator,
  Animated
} from 'react-native';
import { Clock, QrCode, Bell, Calendar, ArrowRight, Megaphone, Zap, LogOut } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import Header from '../components/Header';
import api from '../services/api';
import toast from '../utils/toast';
import { Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

const DashboardScreen = ({ navigation }) => {
  const { user, signOut, dashboardData, fetchDashboardData } = useAuth();
  const [status, setStatus] = useState('Pending');
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(dashboardData?.stats || null);
  const [history, setHistory] = useState(dashboardData?.history || []);
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const [checkoutScale] = useState(new Animated.Value(0.85));
  const [logoutScale] = useState(new Animated.Value(0.85));

  useEffect(() => {
    if (checkoutModalVisible) {
      checkoutScale.setValue(0.85);
      Animated.spring(checkoutScale, {
        toValue: 1,
        friction: 8,
        tension: 55,
        useNativeDriver: true,
      }).start();
    }
  }, [checkoutModalVisible]);

  useEffect(() => {
    if (logoutModalVisible) {
      logoutScale.setValue(0.85);
      Animated.spring(logoutScale, {
        toValue: 1,
        friction: 8,
        tension: 55,
        useNativeDriver: true,
      }).start();
    }
  }, [logoutModalVisible]);

  const formatTime = (timeString) => {
    if (!timeString) return '--:--';
    try {
      const date = new Date(timeString);
      if (isNaN(date.getTime())) return '--:--';
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    } catch (e) {
      return '--:--';
    }
  };

  const processData = (data) => {
    if (data.success) {
      setStats(data.stats);
      setHistory(data.history);
      
      // Handle attendance status
      const todayStatus = data.stats.todayStatus;
      const todayDetails = data.stats.todayDetails;
      if (todayStatus === 'halfday') {
        setStatus('Half Day');
      } else if (todayStatus === 'fullday') {
        setStatus('Full Day');
      } else if (todayDetails?.checkOut) {
        setStatus('Checked Out');
      } else if (todayStatus === 'present' || todayStatus === 'late') {
        setStatus('Checked In');
      } else if (todayStatus === 'absent') {
        setStatus('Marked Absent');
      } else {
        setStatus('Pending');
      }
    }
  };

  const fetchStats = async () => {
    try {
      const data = await fetchDashboardData();
      if (data) {
        processData(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Unable to update statistics.', { title: 'Fetch Error' });
    }
  };

  const getScannerVisibility = () => {
    if (!user?.shiftIn) return { visible: true };
    
    const now = new Date();
    
    // Helper to get time today
    const getShiftTimeToday = (shiftStr) => {
      if (!shiftStr) return null;
      const [hours, minutes] = shiftStr.split(':').map(Number);
      const d = new Date(now);
      d.setHours(hours, minutes, 0, 0);
      return d;
    };

    const morningStart = getShiftTimeToday(user.shiftIn || "09:00");
    const eveningStart = getShiftTimeToday(user.eveningShiftIn || "13:00");

    // Define 20-min-before and 60-min-after scan windows
    const morningStartWin = new Date(morningStart.getTime() - 20 * 60 * 1000);
    const morningEndWin = new Date(morningStart.getTime() + 60 * 60 * 1000);

    const eveningStartWin = new Date(eveningStart.getTime() - 20 * 60 * 1000);
    const eveningEndWin = new Date(eveningStart.getTime() + 60 * 60 * 1000);

    // If we are currently within the Morning check-in window
    if (now >= morningStartWin && now <= morningEndWin) {
      const currentStatus = stats?.todayDetails?.morningStatus;
      if (currentStatus && currentStatus !== 'pending') {
        return { visible: false, hideCard: true };
      }
      return { visible: true, shiftLabel: 'Morning' };
    }

    // If we are currently within the Evening check-in window
    if (now >= eveningStartWin && now <= eveningEndWin) {
      const currentStatus = stats?.todayDetails?.eveningStatus;
      if (currentStatus && currentStatus !== 'pending') {
        return { visible: false, hideCard: true };
      }
      return { visible: true, shiftLabel: 'Evening' };
    }

    // If outside both windows, let's return clean pending statuses
    if (now < morningStartWin) {
      return {
        visible: false,
        title: "Scan Window Not Open",
        message: `Morning scan window opens at ${formatTime(morningStartWin)}.`
      };
    }

    if (now > morningEndWin && now < eveningStartWin) {
      return {
        visible: false,
        title: "Scan Window Not Open",
        message: `Evening scan window opens at ${formatTime(eveningStartWin)}.`
      };
    }

    return {
      visible: false,
      title: "Scan Windows Closed",
      message: "Today's check-in windows have closed."
    };
  };

  useEffect(() => {
    if (dashboardData) {
      processData(dashboardData);
    }
    fetchStats();
  }, []);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleString('en-US', { month: 'short' });
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (e) {
      return dateString;
    }
  };

  const getStatusInfo = (status) => {
    const s = (status || 'pending').toLowerCase();
    switch (s) {
      case 'present':
      case 'fullday': return { color: '#059669', bg: 'bg-green-50', label: 'Full Day' };
      case 'halfday': return { color: '#EA580C', bg: 'bg-orange-50', label: 'Half Day' };
      case 'late': return { color: '#D97706', bg: 'bg-amber-50', label: 'Late' };
      case 'absent': return { color: '#DC2626', bg: 'bg-red-50', label: 'Absent' };
      default: return { color: '#6B7280', bg: 'bg-slate-50', label: 'Pending' };
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }, []);

  const hasCheckedInToday = !!(stats?.todayDetails?.morningCheckIn || stats?.todayDetails?.eveningCheckIn);
  const hasCheckedOutToday = !!stats?.todayDetails?.checkOut;

  const morningStatusStr = (stats?.todayDetails?.morningStatus || 'pending').toLowerCase();
  const eveningStatusStr = (stats?.todayDetails?.eveningStatus || 'pending').toLowerCase();
  const canCheckOut = morningStatusStr === 'present' || morningStatusStr === 'late' || eveningStatusStr === 'present' || eveningStatusStr === 'late' || hasCheckedOutToday;

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const response = await api.post('/staff/checkout');
      if (response.data.success) {
        toast.success('Workday ended! Checked out successfully.', { title: 'Check-Out' });
        setCheckoutModalVisible(false);
        await fetchStats();
      } else {
        toast.error(response.data.message || 'Failed to check out.', { title: 'Check-Out Error' });
      }
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMsg = error.response?.data?.message || 'Server error occurred during checkout.';
      toast.error(errorMsg, { title: 'Check-Out Error' });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const adminNotices = [
    { id: '1', title: 'System Maintenance', message: 'The portal will be down for maintenance on Saturday night.', type: 'alert' },
    { id: '2', title: 'New Attendance Policy', message: 'Please ensure you check in before 9:30 AM to avoid being marked late.', type: 'info' },
  ];

  const upcomingHolidays = [
    { id: '1', name: 'Buddha Purnima', date: 'May 23, 2026', day: 'Saturday' },
  ];

  return (
    <View className="flex-1 bg-white">
      <Header 
        title="Dashboard" 
        showProfile
        onProfile={() => navigation.navigate('Profile')}
      />
      
      <ScrollView 
        contentContainerStyle={{ padding: '6%', paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        <View className="mb-5">
          <Text className="text-2xl font-[800] text-black">
            Hello, {user?.name ? user.name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') : 'User'} 👋
          </Text>
          <Text className="text-base text-gray-500 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        <View 
          className={`p-5 md:p-6 rounded-[24px] mb-5 shadow-sm border ${
            status === 'Checked In' || status === 'Full Day' ? 'bg-green-50 border-green-100' : 
            status === 'Checked Out' ? 'bg-blue-50 border-blue-100' : 
            status === 'Marked Absent' ? 'bg-red-50 border-red-100' : 
            status === 'Half Day' ? 'bg-orange-50 border-orange-100' : 
            'bg-slate-50 border-slate-100'
          }`}
        >
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center flex-1 mr-2">
              <View className={`w-9 h-9 rounded-full items-center justify-center mr-2 ${
                status === 'Checked In' || status === 'Full Day' ? 'bg-green-100' : 
                status === 'Checked Out' ? 'bg-blue-100' : 
                status === 'Half Day' ? 'bg-orange-100' : 
                'bg-slate-200'
              }`}>
                <Clock color={
                  status === 'Checked In' || status === 'Full Day' ? COLORS.success : 
                  status === 'Checked Out' ? '#2563EB' : 
                  status === 'Half Day' ? '#EA580C' : 
                  COLORS.textSecondary
                } size={18} />
              </View>
              <View>
                <Text className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Current Status</Text>
                <Text className={`text-base font-black ${
                  status === 'Checked In' || status === 'Full Day' ? 'text-green-700' : 
                  status === 'Checked Out' ? 'text-blue-700' : 
                  status === 'Half Day' ? 'text-orange-700' : 
                  'text-slate-700'
                }`} numberOfLines={1}>
                  {status}
                </Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Shift Milestones</Text>
              <View className="bg-white/50 px-2 py-0.5 rounded-lg border border-slate-200/50">
                <Text className="text-[10px] font-black text-slate-700">In: {user?.shiftIn || '09:00'}</Text>
                <Text className="text-[10px] font-black text-slate-700">Ev: {user?.eveningShiftIn || '13:00'}</Text>
                <Text className="text-[10px] font-black text-slate-700">Out: {user?.shiftOut || '19:00'}</Text>
              </View>
            </View>
          </View>

            <View className="flex-row flex-wrap gap-2 pt-4 border-t border-slate-200/50">
              <View className="flex-1 min-w-[85px] bg-white/60 p-3 rounded-2xl border border-white/80">
                <Text className="text-[10px] text-slate-400 font-bold uppercase mb-1">Morning</Text>
                <Text className="text-sm font-black text-slate-800">
                  {stats?.todayDetails?.morningCheckIn ? formatTime(stats.todayDetails.morningCheckIn) : '--:--'}
                </Text>
                <View className={`${
                  stats?.todayDetails?.morningStatus === 'present' ? 'bg-green-100' : 
                  stats?.todayDetails?.morningStatus === 'late' ? 'bg-amber-100' : 
                  stats?.todayDetails?.morningStatus === 'absent' ? 'bg-red-100' : 'bg-slate-100'
                } self-start px-1.5 py-0.5 rounded mt-1`}>
                  <Text className={`text-[8px] font-black uppercase ${
                    stats?.todayDetails?.morningStatus === 'present' ? 'text-green-700' : 
                    stats?.todayDetails?.morningStatus === 'late' ? 'text-amber-700' : 
                    stats?.todayDetails?.morningStatus === 'absent' ? 'text-red-700' : 'text-slate-500'
                  }`}>
                    {stats?.todayDetails?.morningStatus || 'pending'}
                  </Text>
                </View>
              </View>
              <View className="flex-1 min-w-[85px] bg-white/60 p-3 rounded-2xl border border-white/80">
                <Text className="text-[10px] text-slate-400 font-bold uppercase mb-1">Evening</Text>
                <Text className="text-sm font-black text-slate-800">
                  {stats?.todayDetails?.eveningCheckIn ? formatTime(stats.todayDetails.eveningCheckIn) : '--:--'}
                </Text>
                <View className={`${
                  stats?.todayDetails?.eveningStatus === 'present' ? 'bg-green-100' : 
                  stats?.todayDetails?.eveningStatus === 'late' ? 'bg-amber-100' : 
                  stats?.todayDetails?.eveningStatus === 'absent' ? 'bg-red-100' : 'bg-slate-100'
                } self-start px-1.5 py-0.5 rounded mt-1`}>
                  <Text className={`text-[8px] font-black uppercase ${
                    stats?.todayDetails?.eveningStatus === 'present' ? 'text-green-700' : 
                    stats?.todayDetails?.eveningStatus === 'late' ? 'text-amber-700' : 
                    stats?.todayDetails?.eveningStatus === 'absent' ? 'text-red-700' : 'text-slate-500'
                  }`}>
                    {stats?.todayDetails?.eveningStatus || 'pending'}
                  </Text>
                </View>
              </View>
              <View className="flex-1 min-w-[85px] bg-white/60 p-3 rounded-2xl border border-white/80">
                <Text className="text-[10px] text-slate-400 font-bold uppercase mb-1">Check Out</Text>
                <Text className="text-sm font-black text-slate-800">
                  {stats?.todayDetails?.checkOut ? formatTime(stats.todayDetails.checkOut) : '--:--'}
                </Text>
                <View className={`${
                  stats?.todayDetails?.checkOut ? 'bg-green-100' : 'bg-slate-100'
                } self-start px-1.5 py-0.5 rounded mt-1`}>
                  <Text className={`text-[8px] font-black uppercase ${
                    stats?.todayDetails?.checkOut ? 'text-green-700' : 'text-slate-500'
                  }`}>
                    {stats?.todayDetails?.checkOut ? 'completed' : 'pending'}
                  </Text>
                </View>
              </View>
            </View>
        </View>

        <View className="mb-5">
          <Text className="text-[20px] font-bold text-black mb-4">Monthly Attendance</Text>
          <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-xs text-gray-400 font-bold tracking-wider uppercase mb-1">Total Attendance</Text>
                <Text className="text-xl font-black text-black">{stats?.totalPresent || 0} Days</Text>
              </View>
              <View className="bg-green-100 px-3 py-1.5 rounded-full">
                <Text className="text-green-600 font-extrabold text-xs">
                  {stats?.totalPresent ? Math.min(100, Math.round((stats.totalPresent / 26) * 100)) : 0}%
                </Text>
              </View>
            </View>
            
            <View className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
              <View 
                className="h-full bg-primary rounded-full" 
                style={{ width: `${stats?.totalPresent ? Math.min(100, Math.round((stats.totalPresent / 26) * 100)) : 0}%` }} 
              />
            </View>

            <View className="flex-row justify-between pt-1">
              <View className="flex-row items-center">
                <View className="w-2 h-2 rounded-full mr-2 bg-primary" />
                <Text className="text-xs text-gray-500 font-semibold">Present</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-2 h-2 rounded-full mr-2 bg-[#FF3B30]" />
                <Text className="text-xs text-gray-500 font-semibold">Absent</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-2 h-2 rounded-full mr-2 bg-[#E1E1E1]" />
                <Text className="text-xs text-gray-500 font-semibold">Pending</Text>
              </View>
            </View>
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-[20px] font-bold text-black mb-4">Daily Action</Text>
          
          {/* 1. QR Scanner Card (Visible when scanner window is active and shift check-in is pending) */}
          {getScannerVisibility().visible && (
            <View className="bg-white rounded-[32px] p-6 flex-row items-center justify-between shadow-xl shadow-slate-200/50 border border-slate-100 mb-4">
              <View className="flex-1 mr-4">
                <View className="bg-primary/10 self-start px-3 py-1 rounded-full mb-3">
                  <Text className="text-primary-600 text-[10px] font-black uppercase tracking-[2px]">Action Required</Text>
                </View>
                <Text className="text-2xl font-black text-slate-800 mb-2">Mark Attendance</Text>
                <Text className="text-slate-500 text-xs leading-5">Scan the store's QR code to record your arrival or departure.</Text>
              </View>
              <TouchableOpacity 
                className="bg-primary px-5 py-5 rounded-[28px] justify-center items-center shadow-lg shadow-primary/30"
                onPress={() => navigation.navigate('QRScanner')}
              >
                <QrCode color="white" size={32} />
                <Text className="text-white text-[10px] font-black uppercase tracking-wider mt-2">Scan Now</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 2. Check Out Card (Visible when the user has checked in for at least one shift today) */}
          {canCheckOut && (
            <View className="bg-white rounded-[32px] p-6 flex-row items-center justify-between shadow-xl shadow-slate-200/50 border border-slate-100">
              <View className="flex-1 mr-4">
                <View className={`self-start px-3 py-1 rounded-full mb-3 border ${
                  hasCheckedOutToday ? 'bg-slate-50 border-slate-200' : 'bg-red-50 border-red-100'
                }`}>
                  <Text className={`text-[10px] font-black uppercase tracking-[2px] ${
                    hasCheckedOutToday ? 'text-slate-400' : 'text-red-600'
                  }`}>
                    {hasCheckedOutToday ? 'Shift Ended' : 'Shift Active'}
                  </Text>
                </View>
                <Text className="text-2xl font-black text-slate-800 mb-2">Check Out</Text>
                <Text className="text-slate-500 text-xs leading-5">
                  {hasCheckedOutToday 
                    ? 'Your workday has ended. You have successfully checked out today.' 
                    : 'Ready to end your workday? Click checkout to record your checkout time.'}
                </Text>
              </View>
              <TouchableOpacity 
                className={`px-5 py-5 rounded-[28px] justify-center items-center shadow-lg ${
                  hasCheckedOutToday ? 'bg-slate-200 shadow-none' : 'bg-[#DC2626] shadow-red-500/30'
                }`}
                disabled={hasCheckedOutToday}
                onPress={() => setCheckoutModalVisible(true)}
              >
                <Clock color={hasCheckedOutToday ? '#94A3B8' : 'white'} size={32} />
                <Text className={`text-[10px] font-black uppercase tracking-wider mt-2 ${
                  hasCheckedOutToday ? 'text-slate-400' : 'text-white'
                }`}>
                  {hasCheckedOutToday ? 'Done' : 'Check Out'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 3. Empty/Status Card (Visible when they are NOT checked in yet AND the QR scan window is not open right now) */}
          {!canCheckOut && !getScannerVisibility().visible && !getScannerVisibility().hideCard && (
            <View className="bg-slate-100 rounded-[32px] p-8 border border-dashed border-slate-300 items-center">
              <View className="bg-slate-200 p-4 rounded-full mb-4">
                <Clock color={COLORS.textSecondary} size={32} />
              </View>
              <Text className="text-lg font-black text-slate-700 mb-1">{getScannerVisibility().title}</Text>
              <Text className="text-slate-500 text-sm text-center px-4">
                {getScannerVisibility().message}
              </Text>
            </View>
          )}
        </View>

        {/* Recent Activity */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-[20px] font-bold text-black">Recent Activity</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AttendanceHistory')}>
              <Text className="text-primary text-sm font-bold">See All</Text>
            </TouchableOpacity>
          </View>
          {history.length > 0 ? (
            history.map((log) => {
              const statusInfo = getStatusInfo(log.status);
              return (
                <View key={log._id || log.date} className="flex-row items-center bg-white p-3 rounded-2xl mb-2.5 border border-gray-50 shadow-sm">
                  <View 
                    className={`w-10 h-10 rounded-xl justify-center items-center mr-3 ${statusInfo.bg}`}
                  >
                    <Clock color={statusInfo.color} size={18} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row justify-between items-center mb-0.5">
                      <Text className="text-sm font-bold text-slate-800">{formatDate(log.date)}</Text>
                      <Text style={{ color: statusInfo.color }} className="text-[10px] font-black uppercase">
                        {statusInfo.label}
                      </Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                      <Text className="text-[11px] text-slate-400 font-bold uppercase">
                        In: {log.morningCheckIn ? formatTime(log.morningCheckIn) : '--:--'} • Out: {log.checkOut ? formatTime(log.checkOut) : '--:--'}
                      </Text>
                      <Text className="text-[10px] text-slate-400 font-bold italic uppercase">{log.branch || 'Office'}</Text>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View className="bg-gray-50 p-6 rounded-2xl items-center border border-dashed border-gray-200">
              <Text className="text-gray-400 font-medium">No recent activity found</Text>
            </View>
          )}
        </View>

        {/* Alerts & Notices */}
        <View className="mb-6">
          <Text className="text-[20px] font-bold text-black mb-4">Alerts & Notices</Text>
          {adminNotices.map((notice) => (
            <View 
              key={notice.id} 
              className={`bg-white p-4 rounded-2xl border-l-4 mb-3 shadow-sm ${
                notice.type === 'alert' ? 'border-[#FF9500]' : 'border-primary'
              }`}
            >
              <View className="flex-row items-center mb-1.5">
                <Megaphone color={notice.type === 'alert' ? '#FF9500' : COLORS.primary} size={18} />
                <Text className="text-[16.5px] font-bold text-black ml-2">{notice.title}</Text>
              </View>
              <Text className="text-[14.5px] text-gray-500 leading-[20px]">{notice.message}</Text>
            </View>
          ))}
        </View>


      </ScrollView>

      {/* Custom Confirmation Popup Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={checkoutModalVisible}
        onRequestClose={() => {
          if (!checkoutLoading) setCheckoutModalVisible(false);
        }}
      >
        <View className="flex-1 bg-black/60 justify-center items-center p-6">
          <Animated.View style={{ transform: [{ scale: checkoutScale }] }} className="bg-white p-6 rounded-2xl w-full max-w-[340px] items-center border border-slate-100 shadow-2xl">
            <View className="bg-red-50 p-4 rounded-full mb-4 border border-red-100">
              <LogOut color="#DC2626" size={32} />
            </View>
            
            <Text className="text-xl font-black text-slate-800 mb-2">Confirm Check-Out</Text>
            <Text className="text-slate-500 text-sm text-center mb-6 leading-5">
              Are you sure you want to end your workday and check out? This will register your checkout time.
            </Text>
            
            <View className="flex-row w-full justify-between gap-x-3">
              <TouchableOpacity 
                className="flex-1 bg-slate-100 py-3.5 rounded-xl justify-center items-center border border-slate-200"
                disabled={checkoutLoading}
                onPress={() => setCheckoutModalVisible(false)}
              >
                <Text className="text-slate-600 font-bold text-sm">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="flex-1 bg-[#DC2626] py-3.5 rounded-xl justify-center items-center shadow-lg shadow-red-500/20"
                disabled={checkoutLoading}
                onPress={handleCheckout}
              >
                {checkoutLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="text-white font-extrabold text-sm">Check Out</Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Custom Logout Confirmation Popup Modal */}
      <Modal
        visible={logoutModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-center items-center p-6">
          <Animated.View style={{ transform: [{ scale: logoutScale }] }} className="bg-white p-6 rounded-2xl w-full max-w-[300px] items-center border border-slate-100 shadow-2xl">
            <View className="bg-red-50 p-3.5 rounded-full mb-4 border border-red-100">
              <LogOut color="#DC2626" size={28} />
            </View>
            
            <Text className="text-lg font-black text-slate-800 mb-1.5">Log Out</Text>
            <Text className="text-slate-500 text-xs text-center mb-5 leading-4">
              Are you sure you want to log out of your account?
            </Text>
            
            <View className="flex-row w-full justify-between gap-x-3">
              <TouchableOpacity 
                className="flex-1 bg-slate-100 py-3 rounded-xl justify-center items-center border border-slate-200"
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text className="text-slate-600 font-bold text-sm">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="flex-1 bg-[#DC2626] py-3 rounded-xl justify-center items-center shadow-lg shadow-red-500/20"
                onPress={() => {
                  setLogoutModalVisible(false);
                  toast.success('Logging out...', { title: 'Log-Out' });
                  signOut();
                }}
              >
                <Text className="text-white font-extrabold text-sm">Logout</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};


export default DashboardScreen;
