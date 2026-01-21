import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FAQItem {
    question: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    bgColor: string;
    steps: string[];
}

const faqData: FAQItem[] = [
    {
        question: 'Minha internet está lenta',
        icon: 'speedometer-outline',
        iconColor: '#f59e0b',
        bgColor: 'bg-amber-50',
        steps: [
            '1. Reinicie seu roteador/modem desligando-o da tomada por 30 segundos',
            '2. Aguarde 2 minutos após religá-lo para a conexão estabilizar',
            '3. Conecte seu dispositivo diretamente ao roteador via cabo de rede (se possível)',
            '4. Faça um teste de velocidade em speedtest.net ou fast.com',
            '5. Verifique se há muitos dispositivos conectados à sua rede',
            '6. Evite usar a internet em horários de pico (19h às 23h)',
            '7. Posicione o roteador em local central e elevado da casa',
            '8. Se o problema persistir, entre em contato com nosso suporte técnico',
        ],
    },
    {
        question: 'Como pagar minha fatura',
        icon: 'card-outline',
        iconColor: '#22c55e',
        bgColor: 'bg-green-50',
        steps: [
            '1. Acesse a aba "Faturas" no menu inferior do app',
            '2. Selecione a fatura que deseja pagar',
            '3. Escolha uma das opções de pagamento:',
            '   • PIX: Toque em "Copiar Código PIX" e cole no app do seu banco',
            '   • Boleto: Toque em "Copiar Código de Barras" e pague pelo app do banco',
            '   • PDF: Toque em "Segunda via de Fatura" para baixar o boleto',
            '4. Após o pagamento, aguarde até 3 horas úteis para confirmação',
            '5. A fatura será movida automaticamente para a aba "Pagas"',
        ],
    },
    {
        question: 'Segunda via de boleto',
        icon: 'document-text-outline',
        iconColor: '#3b82f6',
        bgColor: 'bg-blue-50',
        steps: [
            '1. Acesse a aba "Faturas" no menu inferior do app',
            '2. Localize a fatura desejada na lista',
            '3. Se a fatura estiver vencida, ela aparecerá na aba "Vencidas"',
            '4. Toque na fatura para selecioná-la',
            '5. Toque no botão "Segunda via de Fatura"',
            '6. O PDF do boleto será gerado automaticamente',
            '7. Você pode:',
            '   • Visualizar o boleto diretamente no app',
            '   • Baixar o PDF tocando em "Baixar"',
            '   • Compartilhar via WhatsApp, Email ou outras apps',
            '8. O código de barras e PIX são atualizados automaticamente',
        ],
    },
];

export default function SuporteScreen() {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const toggleExpand = (index: number) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    const openWhatsApp = () => {
        Linking.openURL('https://wa.me/5508000000000'); // Replace with actual number
    };

    const callSupport = () => {
        Linking.openURL('tel:08000000000');
    };

    return (
        <View className="flex-1 bg-slate-50">
            {/* Header */}
            <View className="h-[25%] w-full relative">
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

            {/* Content */}
            <View className="flex-1 -mt-16 px-6">
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
                    {/* Contact Channels */}
                    <View className="bg-white rounded-2xl p-5 shadow-md mb-6">
                        <Text className="text-slate-800 text-lg font-bold mb-4">Canais de Atendimento</Text>

                        <TouchableOpacity
                            onPress={openWhatsApp}
                            className="flex-row items-center p-4 border border-green-100 bg-green-50 rounded-xl mb-3 active:bg-green-100"
                        >
                            <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-4">
                                <Ionicons name="logo-whatsapp" size={24} color="#16a34a" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-800 font-bold text-base">WhatsApp</Text>
                                <Text className="text-slate-500 text-sm">Atendimento rápido e prático</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#16a34a" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={callSupport}
                            className="flex-row items-center p-4 border border-blue-100 bg-blue-50 rounded-xl active:bg-blue-100"
                        >
                            <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4">
                                <Ionicons name="call" size={24} color="#2563eb" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-800 font-bold text-base">Ligue para nós</Text>
                                <Text className="text-slate-500 text-sm">0800 000 0000</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#2563eb" />
                        </TouchableOpacity>
                    </View>

                    {/* FAQ Section */}
                    <Text className="text-slate-800 font-bold text-lg mb-4">Perguntas Frequentes</Text>

                    {faqData.map((faq, index) => (
                        <View key={index} className="mb-3">
                            {/* Question Header */}
                            <TouchableOpacity
                                onPress={() => toggleExpand(index)}
                                className={`bg-white p-4 rounded-xl flex-row items-center shadow-sm ${expandedIndex === index ? 'rounded-b-none border-b border-slate-100' : ''
                                    }`}
                                activeOpacity={0.7}
                            >
                                <View className={`w-10 h-10 ${faq.bgColor} rounded-full items-center justify-center mr-3`}>
                                    <Ionicons name={faq.icon} size={20} color={faq.iconColor} />
                                </View>
                                <Text className="text-slate-700 font-semibold flex-1">{faq.question}</Text>
                                <Ionicons
                                    name={expandedIndex === index ? 'chevron-up' : 'chevron-down'}
                                    size={20}
                                    color="#94a3b8"
                                />
                            </TouchableOpacity>

                            {/* Expanded Steps */}
                            {expandedIndex === index && (
                                <View className="bg-white px-4 pb-4 rounded-b-xl shadow-sm">
                                    <View className="border-l-2 border-purple-200 ml-5 pl-4 py-2">
                                        {faq.steps.map((step, stepIndex) => (
                                            <View key={stepIndex} className="mb-2">
                                                <Text className="text-slate-600 text-sm leading-5">
                                                    {step}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>

                                    {/* Contact Support Button */}
                                    <TouchableOpacity
                                        onPress={openWhatsApp}
                                        className="mt-3 bg-purple-50 border border-purple-200 rounded-lg py-3 px-4 flex-row items-center justify-center"
                                    >
                                        <Ionicons name="chatbubble-ellipses-outline" size={18} color="#7c3aed" />
                                        <Text className="text-purple-700 font-semibold ml-2">
                                            Ainda precisa de ajuda?
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    ))}

                    {/* Additional Help */}
                    <View className="bg-purple-50 rounded-xl p-4 mt-4 border border-purple-100">
                        <View className="flex-row items-center mb-2">
                            <Ionicons name="bulb-outline" size={18} color="#7c3aed" />
                            <Text className="text-purple-800 font-semibold text-sm ml-2">Dica Rápida</Text>
                        </View>
                        <Text className="text-purple-700 text-xs leading-5">
                            A maioria dos problemas de conexão pode ser resolvida reiniciando o roteador por 30 segundos.
                        </Text>
                    </View>
                </ScrollView>
            </View>
        </View>
    );
}
