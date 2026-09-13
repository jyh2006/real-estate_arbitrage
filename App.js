import React, { useState } from 'react';
import { View, StyleSheet, Text, Modal, TouchableOpacity, Dimensions, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { supabase } from './supabaseClient'; 

export default function App() {
  const [properties, setProperties] = useState([]);
  const [selectedProp, setSelectedProp] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 사용자 상태 (예시 조건: 만 28세, 연봉 3800만원)
  // 실제 앱에서는 로그인된 유저의 UUID를 가져와야 하지만 임시로 더미값을 넣습니다.
  const userProfile = { age: 28, income: 38000000, id: 'd04c1071-xxxx-xxxx-xxxx-xxxxxxxxxxxx' };

  // 지도 스와이프 시 화면에 보이는 영역(Bounding Box)의 매물만 가져와 연산
  const fetchPropertiesInRegion = async (region) => {
    const bbox = {
      minLng: region.longitude - region.longitudeDelta / 2,
      maxLng: region.longitude + region.longitudeDelta / 2,
      minLat: region.latitude - region.latitudeDelta / 2,
      maxLat: region.latitude + region.latitudeDelta / 2,
      userAge: userProfile.age,
      userIncome: userProfile.income
    };

    const { data, error } = await supabase.functions.invoke('arbitrage-map', { 
      body: JSON.stringify(bbox) 
    });
    
    if (data) setProperties(data);
  };

  const handleMarkerPress = (prop) => {
    setSelectedProp(prop);
    setModalVisible(true);
  };

  const saveSimulation = async () => {
    if (!selectedProp || isSaving) return;
    setIsSaving(true);
    
    const { error } = await supabase.from('saved_simulations').insert([{
      user_id: userProfile.id,
      property_id: selectedProp.id,
      net_cost_krw: selectedProp.net_cost_krw
    }]);

    if (error) {
      if (error.code === '23505') Alert.alert('알림', '이미 텅장 디펜스 목록에 저장된 매물입니다.');
      else Alert.alert('오류', '저장 중 오류가 발생했습니다.');
    } else {
      Alert.alert('방어 성공! 🛡️', '시뮬레이션이 내 목록에 저장되었습니다.');
      setModalVisible(false);
    }
    setIsSaving(false);
  };

  // 만 원 단위 포맷팅 헬퍼 함수
  const formatManWon = (krw) => `${(krw / 10000).toLocaleString()}만 원`;

  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map}
        initialRegion={{ latitude: 37.4842, longitude: 126.9297, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
        onRegionChangeComplete={fetchPropertiesInRegion}
      >
        {properties.map(prop => (
          <Marker key={prop.id} coordinate={{ latitude: prop.lat, longitude: prop.lng }} onPress={() => handleMarkerPress(prop)}>
            {/* 실부담 30만 원 미만 매물은 초록색으로 시각적 강조 */}
            <View style={[styles.customMarker, prop.net_cost_krw < 300000 && styles.highlightMarker]}>
              <Text style={styles.markerText}>실부담 {prop.net_cost_krw / 10000}만</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            {selectedProp && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedProp.district_name} - {selectedProp.type}</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.closeButton}>✕</Text></TouchableOpacity>
                </View>

                <View style={styles.detailRow}><Text style={styles.label}>명목 월세</Text><Text style={styles.valueRent}>{formatManWon(selectedProp.monthly_rent_krw)}</Text></View>
                <View style={styles.detailRow}><Text style={styles.label}>지자체 주거지원금</Text><Text style={styles.valueSubsidy}>- {formatManWon(selectedProp.youth_subsidy_amount)}</Text></View>
                <View style={styles.detailRow}><Text style={styles.label}>조특법 월세 세액공제</Text><Text style={styles.valueSubsidy}>- {formatManWon(selectedProp.tax_relief_krw)}</Text></View>
                
                <View style={styles.divider} />
                <View style={styles.detailRow}><Text style={styles.labelNet}>최종 실 체감비용</Text><Text style={styles.valueNet}>{formatManWon(selectedProp.net_cost_krw)}</Text></View>
                
                <TouchableOpacity style={[styles.actionButton, isSaving && { backgroundColor: '#9CA3AF' }]} onPress={saveSimulation} disabled={isSaving}>
                  <Text style={styles.actionButtonText}>{isSaving ? '저장 중...' : '이 매물로 이사 시뮬레이션 저장'}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: Dimensions.get('window').width, height: Dimensions.get('window').height },
  customMarker: { backgroundColor: '#4F46E5', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12, borderWidth: 2, borderColor: 'white', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 3, shadowOffset: { width: 0, height: 2 } },
  highlightMarker: { backgroundColor: '#10B981' },
  markerText: { color: 'white', fontWeight: '800', fontSize: 13 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  bottomSheet: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  closeButton: { fontSize: 24, color: '#9CA3AF', fontWeight: 'bold' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 },
  label: { fontSize: 16, color: '#6B7280' },
  labelNet: { fontSize: 18, color: '#111827', fontWeight: '800' },
  valueRent: { fontSize: 16, color: '#EF4444', fontWeight: '600' },
  valueSubsidy: { fontSize: 16, color: '#3B82F6', fontWeight: '600' },
  valueNet: { fontSize: 24, color: '#4F46E5', fontWeight: '900' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 16 },
  actionButton: { backgroundColor: '#4F46E5', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  actionButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});
