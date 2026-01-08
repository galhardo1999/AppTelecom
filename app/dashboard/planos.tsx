
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { ixcApi } from '../../src/services/api';
import { Contract } from '../../src/types/ixc';
import { formatCurrency } from '../../src/utils/formatters';

export default function PlanosScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadContracts();
    }, []);

    const loadContracts = async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const data = await ixcApi.getClientContracts(user.id);
            setContracts(data);
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Não foi possível carregar os planos.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-slate-50">
            <View className="h-[30%] w-full relative">
                <LinearGradient
                    colors={['#a855f7', '#7e22ce', '#3b0764']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="absolute w-full h-full rounded-b-[40px]"
                />
                <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 px-6 pt-4">
                    <Text className="text-white text-2xl font-bold mb-2">Meus Planos</Text>
                    <Text className="text-white/80 text-base">Gerencie seus planos de internet</Text>
                </SafeAreaView>
            </View>

            <View className="flex-1 -mt-20 px-6">
                {loading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator color="#7c3aed" size="large" />
                    </View>
                ) : (
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                        {contracts.map((contract) => (
                            <View key={contract.id} className="bg-white rounded-2xl p-6 shadow-md mb-4">
                                <View className="flex-row justify-between items-center mb-4">
                                    <View className="bg-purple-100 px-3 py-1 rounded-full">
                                        <Text className="text-purple-700 font-bold text-xs uppercase">
                                            {contract.status === 'A' ? 'Ativo' : 'Inativo'}
                                        </Text>
                                    </View>
                                    <Text className="text-slate-500 font-medium">#{contract.id}</Text>
                                </View>
                                <Text className="text-slate-800 text-xl font-bold mb-2">{contract.plano || 'Plano de Internet'}</Text>
                                <Text className="text-slate-500 text-sm mb-4">
                                    {contract.endereco || user?.endereco}
                                </Text>
                                <View className="h-px bg-slate-100 mb-4" />
                                <View className="flex-row justify-between items-center">
                                    <Text className="text-slate-500">Valor Mensal</Text>
                                    <Text className="text-purple-700 text-2xl font-bold">
                                        {formatCurrency((parseFloat(contract.valor_contrato || '0') > 0 ? contract.valor_contrato : contract.valor) ?? '0')}
                                    </Text>
                                </View>
                            </View>
                        ))}
                        {contracts.length === 0 && (
                            <View className="bg-white rounded-2xl p-8 items-center justify-center">
                                <Text className="text-slate-400">Nenhum plano encontrado.</Text>
                            </View>
                        )}
                    </ScrollView>
                )}
            </View>
        </View>
    );
}
