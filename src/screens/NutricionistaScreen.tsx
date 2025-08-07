// src/screens/NutricionistaScreen.tsx - VERSÃO CORRIGIDA E COMPLETA

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Dimensions,
    Image,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { format, subMonths, subYears, isAfter, isSameDay, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AuthStackParamList } from '../navigation/types';

// --- Firebase Imports ---
import { auth, db } from '../../firebaseConfig/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const { width } = Dimensions.get('window');

type MaterialCommunityIconName =
    | 'coffee-outline'
    | 'silverware-fork-knife'
    | 'food-apple';

const refeicoes: { nome: string; icone: MaterialCommunityIconName }[] = [
    { nome: 'Café da Manhã', icone: 'coffee-outline' },
    { nome: 'Almoço', icone: 'silverware-fork-knife' },
    { nome: 'Café da Tarde', icone: 'coffee-outline' },
    { nome: 'Jantar', icone: 'silverware-fork-knife' },
    { nome: 'Ceia', icone: 'food-apple' },
];

const PERIODS: PeriodKey[] = ['1m', '3m', '6m', '1a', 'mais'];
const PERIOD_LABELS = {
    '1m': '1 mês',
    '3m': '3 meses',
    '6m': '6 meses',
    '1a': '1 ano',
    'mais': 'Mais',
};

type PeriodKey = '1m' | '3m' | '6m' | '1a' | 'mais';

const CHART_CONFIG = {
    backgroundGradientFrom: '#1C1C1E',
    backgroundGradientTo: '#1C1C1E',
    decimalPlaces: 1,
    color: () => '#AEF359',
    labelColor: () => 'rgba(255, 255, 255, 0.5)',
    propsForDots: { r: '5', strokeWidth: '2', stroke: '#AEF359' },
    propsForBackgroundLines: { stroke: 'rgba(255, 255, 255, 0.1)' },
    fillShadowGradient: '#AEF359',
    fillShadowGradientOpacity: 0.2,
    yAxisLabel: 'kg ',
    formatYLabel: (yLabel: string) => parseFloat(yLabel).toFixed(1),
};

interface ClientDailyLogEntry {
    calories: number;
    weight: number;
    water: number;
    timestamp: string;
}
interface ClientMetas { pesoMeta?: number; pesoAtual?: number; }
interface ClientNutritionalGoals { metaCalorias?: number; macros?: { proteina: number; carboidratos: number; gordura: number; }; }
interface ClientMealPlan { [day: string]: { [meal: string]: string; }; }
interface ClientImportantNotes { notes: string; }

interface ClientData {
    uid: string;
    nome: string;
    email: string;
    codigoPartilha: string;
    dailyLogs?: Record<string, ClientDailyLogEntry>;
    metas?: ClientMetas;
    calculosNutricionais?: ClientNutritionalGoals;
    planosDeRefeicao?: ClientMealPlan;
    avisosImportantes?: ClientImportantNotes;
    nutricionistaVinculadoUID?: string;
}

type NutricionistaScreenRouteProp = RouteProp<AuthStackParamList, 'Nutricionista'>;
type NutricionistaScreenNavigationProp = NativeStackScreenProps<AuthStackParamList, 'Nutricionista'>['navigation'];

const NutricionistaScreen = () => {
    // =============================================================
    // PARTE LÓGICA (Hooks e Funções)
    // =============================================================
    const route = useRoute<NutricionistaScreenRouteProp>();
    const navigation = useNavigation<NutricionistaScreenNavigationProp>();
    const { clientUid } = route.params || {};

    const [selectedClientData, setSelectedClientData] = useState<ClientData | null>(null);
    const [isLoadingClientData, setIsLoadingClientData] = useState(true);
    const [errorClientData, setErrorClientData] = useState<string | null>(null);
    const [activePeriod, setActivePeriod] = useState<PeriodKey>('1m');
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);
    const [mealDescriptions, setMealDescriptions] = useState<Record<string, string>>({});
    const [importantNotes, setImportantNotes] = useState('');
    const [isLoadingSave, setIsLoadingSave] = useState(false);

    const daysOfWeek = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

    const fetchClientFullData = useCallback(async (uid: string) => {
        setIsLoadingClientData(true);
        setErrorClientData(null);
        try {
            const userDocRef = doc(db, "usuarios", uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                const data = { ...userDocSnap.data(), uid: userDocSnap.id } as ClientData;
                setSelectedClientData(data);
                const currentDayPlan = data.planosDeRefeicao?.[daysOfWeek[selectedDayIndex]] || {};
                const newMealDescriptions: Record<string, string> = {};
                refeicoes.forEach(refeicao => {
                    newMealDescriptions[refeicao.nome] = currentDayPlan[refeicao.nome] || '';
                });
                setMealDescriptions(newMealDescriptions);
                setImportantNotes(data.avisosImportantes?.notes || '');
            } else {
                setErrorClientData("Dados do cliente não encontrados.");
            }
        } catch (error) {
            setErrorClientData("Erro ao carregar dados do cliente.");
        } finally {
            setIsLoadingClientData(false);
        }
    }, [selectedDayIndex]);

    useEffect(() => {
        if (clientUid) {
            fetchClientFullData(clientUid);
        } else {
            setIsLoadingClientData(false);
            setErrorClientData("Nenhum cliente selecionado.");
        }
    }, [clientUid, selectedDayIndex]); // Adicionado selectedDayIndex para recarregar o plano do dia correto

    const chartData = useMemo(() => {
        if (!selectedClientData?.dailyLogs || Object.keys(selectedClientData.dailyLogs).length === 0) {
            return { labels: [], datasets: [{ data: [] }], isEmpty: true };
        }
        const sortedDates = Object.keys(selectedClientData.dailyLogs).sort();
        const labels: string[] = [];
        const dataPoints: number[] = [];
        let startDate: Date;
        const today = startOfDay(new Date());
        switch (activePeriod) {
            case '1m': startDate = subMonths(today, 1); break;
            case '3m': startDate = subMonths(today, 3); break;
            case '6m': startDate = subMonths(today, 6); break;
            case '1a': startDate = subYears(today, 1); break;
            default: startDate = new Date(0); break;
        }
        sortedDates.forEach(dateStr => {
            const logDate = parseISO(dateStr);
            if (isAfter(logDate, startDate) || isSameDay(logDate, startDate)) {
                const weight = selectedClientData.dailyLogs?.[dateStr]?.weight;
                if (typeof weight === 'number') {
                    dataPoints.push(weight);
                    labels.push(format(logDate, 'dd/MM'));
                }
            }
        });
        if (dataPoints.length === 0) return { labels: [], datasets: [{ data: [] }], isEmpty: true };
        return { labels, datasets: [{ data: dataPoints }], isEmpty: false };
    }, [selectedClientData, activePeriod]);

    const handleSave = useCallback(async () => {
        if (!clientUid) return;
        setIsLoadingSave(true);
        try {
            const clientDocRef = doc(db, "usuarios", clientUid);
            const currentDayName = daysOfWeek[selectedDayIndex];
            const dataToUpdate = {
                [`planosDeRefeicao.${currentDayName}`]: mealDescriptions,
                'avisosImportantes.notes': importantNotes
            };
            await updateDoc(clientDocRef, dataToUpdate);
            Alert.alert("Sucesso", "Plano alimentar atualizado!");
        } catch (error) {
            Alert.alert("Erro", "Não foi possível salvar as alterações.");
        } finally {
            setIsLoadingSave(false);
        }
    }, [clientUid, selectedDayIndex, mealDescriptions, importantNotes]);

    const handleLogout = useCallback(() => {
        Alert.alert("Sessão Encerrada", "Você foi desconectado do plano do cliente.", [{ text: "OK", onPress: () => navigation.goBack() }]);
    }, [navigation]);

    // =============================================================
    // PARTE VISUAL (JSX)
    // =============================================================
    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
            <View style={styles.headerContainer}>
                <Image
                    source={require('../../assets/background_nutri.png')}
                    style={styles.headerImage}
                    resizeMode="cover"
                />
                <View style={styles.headerOverlay} />
            </View>

            {isLoadingClientData ? (
                <ActivityIndicator size="large" color="#AEF359" style={{ marginTop: 50 }} />
            ) : errorClientData || !selectedClientData ? (
                <View style={styles.centeredMessage}>
                    <Text style={styles.errorText}>{errorClientData || "Cliente não encontrado."}</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.retryButton}>
                        <Text style={styles.retryButtonText}>Voltar</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    <Text style={styles.title}>Olá, Nutricionista</Text>
                    <Text style={styles.subtitle}>
                        Sessão de edição ativa para: <Text style={{ fontWeight: 'bold' }}>{selectedClientData.nome}</Text>.
                    </Text>

                    <View style={styles.periodSelector}>
                        {PERIODS.map((p) => (
                            <TouchableOpacity key={p} onPress={() => setActivePeriod(p)} style={[styles.periodButton, activePeriod === p && styles.periodButtonActive]}>
                                <Text style={[styles.periodButtonText, activePeriod === p && styles.periodButtonTextActive]}>{PERIOD_LABELS[p]}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.chartWrapper}>
                        {chartData.isEmpty ? (
                            <Text style={styles.noDataText}>Nenhum dado de peso para exibir.</Text>
                        ) : (
                            <LineChart
                                data={chartData}
                                width={width - 40}
                                height={220}
                                chartConfig={CHART_CONFIG}
                                bezier
                            />
                        )}
                    </View>

                    <Text style={styles.sectionTitle}>Divisão das Refeições</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekDaysContainer}>
                        {daysOfWeek.map((day, index) => (
                            <TouchableOpacity key={day} onPress={() => setSelectedDayIndex(index)} style={[styles.dayButton, selectedDayIndex === index && styles.dayButtonActive]}>
                                <Text style={[styles.dayButtonText, selectedDayIndex === index && styles.dayButtonTextActive]}>{day}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {refeicoes.map(ref => (
                            <View key={ref.nome} style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.iconCircle}><MaterialCommunityIcons name={ref.icone} size={20} color="#82CD32" /></View>
                                    <Text style={styles.cardTitle}>{ref.nome}</Text>
                                </View>
                                <TextInput
                                    placeholder="Adicionar descrição..."
                                    placeholderTextColor="#bbb"
                                    style={styles.inputBox}
                                    multiline
                                    value={mealDescriptions[ref.nome] || ''}
                                    onChangeText={text => setMealDescriptions(prev => ({ ...prev, [ref.nome]: text }))}
                                />
                            </View>
                        ))}
                    </ScrollView>

                    <View style={styles.importantBox}>
                        <View style={styles.cardHeader}>
                            <MaterialCommunityIcons name="alert-circle" size={20} color="#AEF359" style={{ marginRight: 6 }} />
                            <Text style={styles.importantTitle}>Avisos Importantes</Text>
                        </View>
                        <TextInput
                            placeholder="Informações importantes para o cliente..."
                            placeholderTextColor="#bbb"
                            style={styles.inputBox}
                            multiline
                            value={importantNotes}
                            onChangeText={setImportantNotes}
                        />
                    </View>

                    <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={isLoadingSave}>
                        {isLoadingSave ? <ActivityIndicator color="#000" /> : <Text style={styles.saveButtonText}>Salvar Alterações</Text>}
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                        <MaterialCommunityIcons name="logout" size={18} color="#AEF359" />
                        <Text style={styles.logoutText}>Sair da Sessão do Cliente</Text>
                    </TouchableOpacity>
                </>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', paddingHorizontal: 20 },
    headerContainer: { height: 200, width: '110%', left: -20, marginBottom: -20 },
    headerImage: { position: 'absolute', width: '100%', height: '100%' },
    headerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
    centeredMessage: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
    errorText: { color: '#ff8a80', fontSize: 16, textAlign: 'center', marginBottom: 20 },
    retryButton: { backgroundColor: '#AEF359', paddingVertical: 10, paddingHorizontal: 30, borderRadius: 20 },
    retryButtonText: { color: '#000', fontWeight: 'bold' },
    title: { color: '#FFF', fontSize: 28, fontWeight: 'bold', marginTop: 10 },
    subtitle: { color: '#bbb', fontSize: 14, marginTop: 5, marginBottom: 20 },
    periodSelector: { flexDirection: 'row', backgroundColor: '#1C1C1E', borderRadius: 50, padding: 4, justifyContent: 'space-around' },
    periodButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 50, alignItems: 'center' },
    periodButtonActive: { backgroundColor: '#AEF359' },
    periodButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
    periodButtonTextActive: { color: '#000' },
    chartWrapper: { marginTop: 20, borderRadius: 20, backgroundColor: '#1C1C1E', padding: 10, alignItems: 'center' },
    noDataText: { color: '#9E9E9E', padding: 40 },
    sectionTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginTop: 40, marginBottom: 10 },
    weekDaysContainer: { paddingBottom: 10 },
    dayButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#1C1C1E', marginRight: 10 },
    dayButtonActive: { backgroundColor: '#AEF359' },
    dayButtonText: { color: '#FFF', fontWeight: 'bold' },
    dayButtonTextActive: { color: '#000' },
    card: { width: width * 0.7, backgroundColor: '#1C1C1E', borderRadius: 20, padding: 16, marginRight: 16 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    iconCircle: { backgroundColor: '#264D1F', borderRadius: 20, padding: 6, marginRight: 8 },
    cardTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    inputBox: { backgroundColor: '#2c2c2e', color: '#FFF', borderRadius: 12, padding: 12, minHeight: 80, textAlignVertical: 'top' },
    importantBox: { backgroundColor: '#1C1C1E', borderRadius: 20, padding: 16, marginTop: 30 },
    importantTitle: { color: '#AEF359', fontSize: 20, fontWeight: 'bold' },
    saveButton: { backgroundColor: '#AEF359', paddingVertical: 15, borderRadius: 30, alignItems: 'center', marginTop: 30, marginHorizontal: 20 },
    saveButtonText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
    logoutButton: { marginTop: 20, marginBottom: 40, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8 },
    logoutText: { color: '#AEF359', fontSize: 16, fontWeight: 'bold' },
});

export default NutricionistaScreen;