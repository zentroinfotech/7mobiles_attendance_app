import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Calendar, ChevronRight, MapPin, CheckCircle2, XCircle, Clock, AlertCircle, TrendingUp, History } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import Header from '../components/Header';
import api from '../services/api';
import Toast from 'react-native-toast-message';

const AttendanceHistoryScreen = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await api.get('/staff/history');
      if (response.data.success) {
        setHistory(response.data.history || []);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load attendance records'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const getStatusInfo = (status) => {
    const s = (status || 'pending').toLowerCase();
    switch (s) {
      case 'present':
      case 'fullday': return { bg: '#ECFDF5', text: '#059669', icon: CheckCircle2, label: 'Full Day' };
      case 'late': return { bg: '#FFFBEB', text: '#D97706', icon: Clock, label: 'Late' };
      case 'absent': return { bg: '#FEF2F2', text: '#DC2626', icon: XCircle, label: 'Absent' };
      case 'halfday': return { bg: '#FFF7ED', text: '#EA580C', icon: Clock, label: 'Half Day' };
      default: return { bg: '#F3F4F6', text: '#6B7280', icon: History, label: 'Pending' };
    }
  };
  const getRecordStatus = (record) => {
    if (record.status && record.status !== 'pending') return record.status;
    const m = (record.morningStatus || 'pending').toLowerCase();
    const e = (record.eveningStatus || 'pending').toLowerCase();
    
    const isMorningActive = m === 'present' || m === 'late';
    const isEveningActive = e === 'present' || e === 'late';
    
    if (m === 'absent' && e === 'absent') return 'absent';
    if (isMorningActive && isEveningActive) return 'fullday';
    if ((isMorningActive && e === 'absent') || (isEveningActive && m === 'absent')) return 'halfday';
    return 'pending';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parts[2];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[monthIndex] || 'Jan';
      return `${day}-${month}-${year}`;
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const day = date.getDate().toString().padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (e) {
      return dateString;
    }
  };

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

  const morningPresent = history.filter(r => {
    const s = (r.morningStatus || '').toLowerCase();
    return s === 'present' || s === 'late';
  }).length;
  const morningLate = history.filter(r => (r.morningStatus || '').toLowerCase() === 'late').length;
  const morningAbsent = history.filter(r => (r.morningStatus || '').toLowerCase() === 'absent').length;

  const eveningPresent = history.filter(r => {
    const s = (r.eveningStatus || '').toLowerCase();
    return s === 'present' || s === 'late';
  }).length;
  const eveningLate = history.filter(r => (r.eveningStatus || '').toLowerCase() === 'late').length;
  const eveningAbsent = history.filter(r => (r.eveningStatus || '').toLowerCase() === 'absent').length;

  const totalShiftsPresent = morningPresent + eveningPresent;
  const totalPossibleShifts = history.length * 2;
  const attendanceRate = totalPossibleShifts ? Math.round((totalShiftsPresent / totalPossibleShifts) * 100) : 0;

  const stats = {
    total: history.length,
    present: totalShiftsPresent,
  };

  return (
    <View className="flex-1 bg-[#F2F2F7]">
      <Header 
        title="Attendance Logs" 
        showBack 
        onBack={() => navigation.goBack()} 
        showLogo={false}
      />

      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text className="mt-4 text-slate-400 font-bold tracking-widest uppercase text-[10px]">Syncing Records...</Text>
        </View>
      ) : (
        <ScrollView 
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
        >
          {/* Dashboard Summary (Original Style) */}
          <View className="p-6 pb-0">
            <Text className="text-[20px] font-bold text-black mb-4">Monthly Performance</Text>
            <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row justify-between items-center mb-4">
                <View>
                  <Text className="text-xs text-gray-400 font-bold tracking-wider uppercase mb-1">Overall Attendance</Text>
                  <Text className="text-2xl font-black text-black">{totalShiftsPresent} / {totalPossibleShifts} Shifts</Text>
                </View>
                <View className="bg-green-100 px-3 py-1.5 rounded-full">
                  <Text className="text-green-600 font-extrabold text-xs">
                    {attendanceRate}% Rate
                  </Text>
                </View>
              </View>
              
              <View className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-6">
                <View 
                  className="h-full bg-emerald-500 rounded-full" 
                  style={{ width: `${attendanceRate}%` }} 
                />
              </View>

              {/* Differentiated Shifts */}
              <View className="flex-row justify-between pt-1">
                {/* Morning Shift */}
                <View className="flex-1 pr-4 border-r border-slate-100">
                  <Text className="text-xs font-black text-primary mb-3 uppercase tracking-wider">Morning Shift</Text>
                  
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center">
                      <View className="w-2 h-2 rounded-full mr-2 bg-emerald-500" />
                      <Text className="text-[11px] text-gray-500 font-semibold">Present</Text>
                    </View>
                    <Text className="text-xs font-bold text-slate-800">{morningPresent - morningLate}</Text>
                  </View>

                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center">
                      <View className="w-2 h-2 rounded-full mr-2 bg-amber-400" />
                      <Text className="text-[11px] text-gray-500 font-semibold">Late</Text>
                    </View>
                    <Text className="text-xs font-bold text-slate-800">{morningLate}</Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View className="w-2 h-2 rounded-full mr-2 bg-red-500" />
                      <Text className="text-[11px] text-gray-500 font-semibold">Absent</Text>
                    </View>
                    <Text className="text-xs font-bold text-slate-800">{morningAbsent}</Text>
                  </View>
                </View>

                {/* Evening Shift */}
                <View className="flex-1 pl-4">
                  <Text className="text-xs font-black text-[#EA580C] mb-3 uppercase tracking-wider">Evening Shift</Text>
                  
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center">
                      <View className="w-2 h-2 rounded-full mr-2 bg-emerald-500" />
                      <Text className="text-[11px] text-gray-500 font-semibold">Present</Text>
                    </View>
                    <Text className="text-xs font-bold text-slate-800">{eveningPresent - eveningLate}</Text>
                  </View>

                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center">
                      <View className="w-2 h-2 rounded-full mr-2 bg-amber-400" />
                      <Text className="text-[11px] text-gray-500 font-semibold">Late</Text>
                    </View>
                    <Text className="text-xs font-bold text-slate-800">{eveningLate}</Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View className="w-2 h-2 rounded-full mr-2 bg-red-500" />
                      <Text className="text-[11px] text-gray-500 font-semibold">Absent</Text>
                    </View>
                    <Text className="text-xs font-bold text-slate-800">{eveningAbsent}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View className="px-6 pt-6">
            <View className="flex-row items-center justify-between mb-4 px-2">
              <Text className="text-sm font-black text-slate-400 uppercase tracking-widest">Daily Timeline</Text>
              <Text className="text-[10px] font-bold text-primary">Total: {stats.total} Days</Text>
            </View>

            {history.length === 0 ? (
              <View className="bg-white p-12 rounded-2xl items-center border border-slate-100">
                <View className="bg-slate-50 w-20 h-20 rounded-full items-center justify-center mb-4">
                  <History color="#cbd5e1" size={40} />
                </View>
                <Text className="text-slate-400 font-bold">No attendance logs found</Text>
              </View>
            ) : (
              <View className="space-y-4">
                {history.map((record, index) => {
                  const statusInfo = getStatusInfo(getRecordStatus(record));
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <View 
                      key={record._id || index}
                      className="bg-white rounded-2xl p-5 shadow-sm border border-white"
                    >
                      <View className="flex-row justify-between items-center mb-4">
                        <View className="flex-row items-center">
                          <Text className="text-base font-black text-slate-900">{formatDate(record.date)}</Text>
                          <View className="ml-2 bg-slate-100 px-1.5 py-0.5 rounded-md">
                            <Text className="text-[8px] text-slate-500 font-black uppercase tracking-tighter">Working Day</Text>
                          </View>
                        </View>
                        <View 
                          style={{ backgroundColor: statusInfo.bg }} 
                          className="flex-row items-center px-3 py-1.5 rounded-xl"
                        >
                          <StatusIcon color={statusInfo.text} size={12} strokeWidth={3} />
                          <Text style={{ color: statusInfo.text }} className="text-[10px] font-black uppercase ml-1.5">
                            {statusInfo.label}
                          </Text>
                        </View>
                      </View>

                      {/* Milestones */}
                      <View className="flex-row bg-slate-50 rounded-2xl p-3 justify-between">
                        {[
                          { label: 'Morning', time: record.morningCheckIn, status: record.morningStatus },
                          { label: 'Evening', time: record.eveningCheckIn, status: record.eveningStatus },
                          { label: 'Checkout', time: record.checkOut, status: 'present' },
                        ].map((m, i) => {
                          const isAbsent = m.status === 'absent';
                          const mStatus = (m.time || isAbsent) 
                            ? getStatusInfo(m.status === 'present' && m.label === 'Checkout' ? 'present' : m.status) 
                            : getStatusInfo('pending');
                          
                          return (
                            <View key={i} className="items-center flex-1">
                              <Text className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-1.5">{m.label}</Text>
                              <View 
                                style={{ 
                                  backgroundColor: (m.time || isAbsent) ? mStatus.bg : 'transparent', 
                                  borderStyle: (m.time || isAbsent) ? 'solid' : 'dashed',
                                  borderColor: isAbsent ? '#FECACA' : (m.time ? 'transparent' : '#E2E8F0')
                                }} 
                                className="w-full py-2 rounded-xl items-center border"
                              >
                                <Text style={{ color: (m.time || isAbsent) ? mStatus.text : '#94a3b8' }} className="text-[10px] font-black uppercase">
                                  {m.time ? formatTime(m.time) : (isAbsent ? 'Absent' : '--:--')}
                                </Text>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default AttendanceHistoryScreen;
