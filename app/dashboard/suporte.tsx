
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SuporteScreen() {

    const openWhatsApp = () => {
        Linking.openURL('https://wa.me/5508000000000'); // Replace with actual number
    };

    const callSupport = () => {
        Linking.openURL('tel:08000000000');
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
                    <Text className="text-white text-2xl font-bold mb-2">Central de Ajuda</Text>
                    <Text className="text-white/80 text-base">Como podemos ajudar você hoje?</Text>
                </SafeAreaView>
            </View>

            <View className="flex-1 -mt-20 px-6">
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View className="bg-white rounded-2xl p-6 shadow-md mb-6">
                        <Text className="text-slate-800 text-lg font-bold mb-4">Canais de Atendimento</Text>

                        <TouchableOpacity onPress={openWhatsApp} className="flex-row items-center p-4 border border-green-100 bg-green-50 rounded-xl mb-3">
                            <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-4">
                                <Ionicons name="logo-whatsapp" size={24} color="#16a34a" />
                            </View>
                            <View>
                                <Text className="text-slate-800 font-bold text-base">WhatsApp</Text>
                                <Text className="text-slate-500 text-sm">Fale com nosso suporte</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={callSupport} className="flex-row items-center p-4 border border-blue-100 bg-blue-50 rounded-xl">
                            <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4">
                                <Ionicons name="call" size={24} color="#2563eb" />
                            </View>
                            <View>
                                <Text className="text-slate-800 font-bold text-base">Ligue para nós</Text>
                                <Text className="text-slate-500 text-sm">0800 000 0000</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <Text className="text-slate-600 font-bold text-lg mb-4 ml-2">Perguntas Frequentes</Text>

                    {['Minha internet está lenta', 'Como pagar minha fatura', 'Segunda via de boleto'].map((faq, index) => (
                        <TouchableOpacity key={index} className="bg-white p-4 rounded-xl mb-3 flex-row justify-between items-center shadow-sm">
                            <Text className="text-slate-700 font-medium">{faq}</Text>
                            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </View>
    );
}
