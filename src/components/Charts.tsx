import React from 'react';
import { DimensionValue, Text, View } from 'react-native';

interface DataPoint {
    label: string;
    value: number;
    color?: string;
}

interface SimpleBarChartProps {
    data: DataPoint[];
    title?: string;
    height?: number;
    barColor?: string;
    showValues?: boolean;
    formatValue?: (value: number) => string;
}

/**
 * Componente de gráfico de barras simples sem dependências externas
 */
export function SimpleBarChart({
    data,
    title,
    height = 150,
    barColor = '#7c3aed',
    showValues = true,
    formatValue = (v) => v.toFixed(1),
}: SimpleBarChartProps) {
    // Find max value for scaling
    const maxValue = Math.max(...data.map(d => d.value), 1);

    return (
        <View className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            {title && (
                <Text className="text-slate-700 font-semibold text-base mb-4">{title}</Text>
            )}

            <View style={{ height }} className="flex-row items-end justify-between">
                {data.map((item, index) => {
                    const barHeight = (item.value / maxValue) * (height - 30);
                    const color = item.color || barColor;

                    return (
                        <View key={index} className="flex-1 items-center mx-1">
                            {/* Value on top */}
                            {showValues && item.value > 0 && (
                                <Text
                                    className="text-slate-500 text-xs mb-1 font-medium"
                                    numberOfLines={1}
                                >
                                    {formatValue(item.value)}
                                </Text>
                            )}

                            {/* Bar */}
                            <View
                                style={{
                                    height: Math.max(barHeight, 4),
                                    backgroundColor: color,
                                    width: '100%' as DimensionValue,
                                }}
                                className="rounded-t-md"
                            />

                            {/* Label */}
                            <Text
                                className="text-slate-400 text-xs mt-2 text-center"
                                numberOfLines={1}
                            >
                                {item.label}
                            </Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

interface UsageChartProps {
    downloadGB: number;
    uploadGB: number;
}

/**
 * Gráfico específico para consumo de internet (Download/Upload)
 */
export function UsageChart({ downloadGB, uploadGB }: UsageChartProps) {
    const data: DataPoint[] = [
        { label: 'Download', value: downloadGB, color: '#22c55e' },
        { label: 'Upload', value: uploadGB, color: '#3b82f6' },
    ];

    return (
        <SimpleBarChart
            data={data}
            title="Consumo Atual"
            height={120}
            formatValue={(v) => `${v.toFixed(1)} GB`}
        />
    );
}

interface DailyUsageProps {
    dailyData: { day: string; download: number; upload: number }[];
}

/**
 * Gráfico de consumo diário dos últimos 7 dias
 */
export function DailyUsageChart({ dailyData }: DailyUsageProps) {
    // Transform to bar chart data (showing total per day)
    const data: DataPoint[] = dailyData.map(d => ({
        label: d.day,
        value: d.download + d.upload,
        color: '#7c3aed',
    }));

    return (
        <SimpleBarChart
            data={data}
            title="Consumo Semanal (GB)"
            height={130}
            formatValue={(v) => v.toFixed(1)}
        />
    );
}

interface DailyUsageChartDualProps {
    downloadGB: number;
    uploadGB: number;
    dailyDownloadGB?: number;
    dailyUploadGB?: number;
}

/**
 * Gráfico de consumo diário com barras duplas (Download/Upload)
 */
export function DailyConsumptionChart({
    downloadGB,
    uploadGB,
    dailyDownloadGB = 0,
    dailyUploadGB = 0
}: DailyUsageChartDualProps) {
    const maxValue = Math.max(downloadGB, uploadGB, 0.1);
    const totalConsumption = downloadGB + uploadGB;
    const dailyTotal = dailyDownloadGB + dailyUploadGB;

    return (
        <View className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4">
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-slate-700 font-semibold text-base">Consumo de Dados</Text>
                <View className="bg-purple-100 px-2 py-1 rounded-lg">
                    <Text className="text-purple-700 text-xs font-medium">
                        Total: {totalConsumption.toFixed(2)} GB
                    </Text>
                </View>
            </View>

            {/* Bar Chart */}
            <View className="flex-row items-end justify-around" style={{ height: 120 }}>
                {/* Download Bar */}
                <View className="items-center flex-1 mx-2">
                    <Text className="text-green-600 text-sm font-bold mb-1">
                        {downloadGB.toFixed(2)} GB
                    </Text>
                    <View
                        style={{
                            height: Math.max((downloadGB / maxValue) * 80, 8),
                            width: '100%'
                        }}
                        className="bg-green-500 rounded-t-lg"
                    />
                    <View className="flex-row items-center mt-2">
                        <View className="w-2 h-2 rounded-full bg-green-500 mr-1" />
                        <Text className="text-slate-600 text-xs">Download</Text>
                    </View>
                </View>

                {/* Upload Bar */}
                <View className="items-center flex-1 mx-2">
                    <Text className="text-blue-600 text-sm font-bold mb-1">
                        {uploadGB.toFixed(2)} GB
                    </Text>
                    <View
                        style={{
                            height: Math.max((uploadGB / maxValue) * 80, 8),
                            width: '100%'
                        }}
                        className="bg-blue-500 rounded-t-lg"
                    />
                    <View className="flex-row items-center mt-2">
                        <View className="w-2 h-2 rounded-full bg-blue-500 mr-1" />
                        <Text className="text-slate-600 text-xs">Upload</Text>
                    </View>
                </View>
            </View>

            {/* Daily consumption if available */}
            {dailyTotal > 0 && (
                <View className="mt-4 pt-3 border-t border-slate-100">
                    <View className="flex-row justify-between items-center">
                        <Text className="text-slate-500 text-sm">Consumo Diário</Text>
                        <Text className="text-purple-600 font-semibold">
                            {dailyTotal.toFixed(2)} GB
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );
}

interface TrafficComparisonProps {
    currentDownload: number;
    currentUpload: number;
    planLimit?: number;
}

/**
 * Componente visual de comparação de tráfego com barra de progresso
 */
export function TrafficComparison({
    currentDownload,
    currentUpload,
    planLimit
}: TrafficComparisonProps) {
    const total = currentDownload + currentUpload;
    const downloadPercent = total > 0 ? (currentDownload / total) * 100 : 0;
    const uploadPercent = total > 0 ? (currentUpload / total) * 100 : 0;

    return (
        <View className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <Text className="text-slate-700 font-semibold text-base mb-4">
                Distribuição de Tráfego
            </Text>

            {/* Traffic bar */}
            <View className="h-6 rounded-full overflow-hidden flex-row bg-slate-100">
                <View
                    style={{ width: `${downloadPercent}%` as DimensionValue }}
                    className="bg-green-500 h-full"
                />
                <View
                    style={{ width: `${uploadPercent}%` as DimensionValue }}
                    className="bg-blue-500 h-full"
                />
            </View>

            {/* Legend */}
            <View className="flex-row justify-between mt-3">
                <View className="flex-row items-center">
                    <View className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                    <Text className="text-slate-600 text-sm">
                        Download ({downloadPercent.toFixed(0)}%)
                    </Text>
                </View>
                <View className="flex-row items-center">
                    <View className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
                    <Text className="text-slate-600 text-sm">
                        Upload ({uploadPercent.toFixed(0)}%)
                    </Text>
                </View>
            </View>

            {/* Plan limit indicator */}
            {planLimit && (
                <View className="mt-4 pt-3 border-t border-slate-100">
                    <View className="flex-row justify-between items-center">
                        <Text className="text-slate-500 text-sm">Limite do Plano</Text>
                        <Text className="text-slate-700 font-semibold">{planLimit} GB</Text>
                    </View>
                    <View className="h-2 rounded-full bg-slate-100 mt-2">
                        <View
                            style={{
                                width: `${Math.min((total / planLimit) * 100, 100)}%` as DimensionValue
                            }}
                            className={`h-full rounded-full ${total / planLimit > 0.9 ? 'bg-red-500' :
                                total / planLimit > 0.7 ? 'bg-yellow-500' :
                                    'bg-purple-500'
                                }`}
                        />
                    </View>
                    <Text className="text-slate-400 text-xs mt-1 text-right">
                        {((total / planLimit) * 100).toFixed(0)}% utilizado
                    </Text>
                </View>
            )}
        </View>
    );
}
