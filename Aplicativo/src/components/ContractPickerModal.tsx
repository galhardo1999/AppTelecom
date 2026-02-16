import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Contract } from '../types/ixc';

interface ContractPickerModalProps {
    visible: boolean;
    contracts: Contract[];
    selectedContractId: string | null;
    onSelect: (contract: Contract) => void;
    onClose: () => void;
}

/**
 * Returns status display info (label, colors) for a contract status code
 */
function getStatusInfo(status: string) {
    switch (status) {
        case 'A':
            return { label: 'Ativo', color: 'bg-green-100', textColor: 'text-green-700', dotColor: 'bg-green-500' };
        case 'I':
            return { label: 'Inativo', color: 'bg-red-100', textColor: 'text-red-700', dotColor: 'bg-red-500' };
        case 'B':
            return { label: 'Bloqueado', color: 'bg-orange-100', textColor: 'text-orange-700', dotColor: 'bg-orange-500' };
        case 'C':
            return { label: 'Cancelado', color: 'bg-gray-100', textColor: 'text-gray-700', dotColor: 'bg-gray-500' };
        default:
            return { label: status, color: 'bg-slate-100', textColor: 'text-slate-700', dotColor: 'bg-slate-500' };
    }
}

/**
 * Reusable contract picker modal
 * Replaces duplicate contract selection modals across dashboard screens
 */
export function ContractPickerModal({
    visible,
    contracts,
    selectedContractId,
    onSelect,
    onClose,
}: ContractPickerModalProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-white rounded-t-3xl">
                    <View className="p-5 border-b border-slate-100">
                        <View className="flex-row justify-between items-center">
                            <Text className="text-xl font-bold text-slate-800">Selecione o Contrato</Text>
                            <TouchableOpacity onPress={onClose}>
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <ScrollView className="max-h-80">
                        {contracts.map((contract) => {
                            const isSelected = contract.id === selectedContractId;
                            const statusInfo = getStatusInfo(contract.status);
                            return (
                                <TouchableOpacity
                                    key={contract.id}
                                    onPress={() => onSelect(contract)}
                                    className={`flex-row items-center p-4 border-b border-slate-100 ${isSelected ? 'bg-purple-50' : 'bg-white'
                                        }`}
                                >
                                    <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${isSelected ? 'bg-purple-600' : 'bg-slate-100'
                                        }`}>
                                        <Ionicons
                                            name="document-text"
                                            size={20}
                                            color={isSelected ? 'white' : '#64748b'}
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <View className="flex-row items-center flex-wrap mr-2">
                                            <Text className={`font-bold text-base ${isSelected ? 'text-purple-700' : 'text-slate-700'}`}>
                                                {contract.id} - {contract.contrato}
                                            </Text>

                                        </View>
                                        <Text className="text-slate-500 text-sm mt-1" numberOfLines={2}>
                                            {contract.endereco ?
                                                `${contract.endereco}, ${contract.numero || 'S/N'} - ${contract.bairro || ''}, ${contract.cidade}`
                                                : 'Endereço não disponível'}
                                        </Text>
                                    </View>
                                    {isSelected && (
                                        <Ionicons name="checkmark-circle" size={24} color="#7c3aed" />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                    <View className="p-5">
                        <TouchableOpacity
                            onPress={onClose}
                            className="bg-slate-100 rounded-xl py-4 items-center"
                        >
                            <Text className="text-slate-600 font-semibold">Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
