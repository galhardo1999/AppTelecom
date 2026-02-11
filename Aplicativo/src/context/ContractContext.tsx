import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ixcApi } from '../services/api';
import { Contract } from '../types/ixc';
import { useAuth } from './AuthContext';

interface ContractContextType {
    contracts: Contract[];
    selectedContract: Contract | null;
    selectedContractId: string | null;
    setSelectedContract: (contract: Contract) => void;
    loading: boolean;
    hasUserSelectedContract: boolean; // Indica se usuário já escolheu contrato nesta sessão
    setHasUserSelectedContract: (value: boolean) => void;
    refreshContracts: () => Promise<void>;
}

const ContractContext = createContext<ContractContextType | undefined>(undefined);

export function ContractProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [selectedContract, setSelectedContractState] = useState<Contract | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasUserSelectedContract, setHasUserSelectedContract] = useState(false);

    // Carregar contratos quando o usuário mudar
    useEffect(() => {
        const loadContracts = async () => {
            if (!user?.id) {
                // Reset de todos os estados no logout
                setContracts([]);
                setSelectedContractState(null);
                setHasUserSelectedContract(false); // Reset para próximo login
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await ixcApi.getClientContracts(user.id);

                // Garantir que contractsList é um array
                const contractsList = Array.isArray(response) ? response : [];
                setContracts(contractsList);

                // Selecionar o primeiro contrato ativo ou o primeiro da lista
                if (contractsList.length > 0) {
                    const activeContract = contractsList.find((c: Contract) => c.status === 'A') || contractsList[0];
                    setSelectedContractState(activeContract || null);
                } else {
                    setSelectedContractState(null);
                }
            } catch (error) {
                console.error('Error loading contracts:', error);
                setContracts([]);
                setSelectedContractState(null);
            } finally {
                setLoading(false);
            }
        };

        loadContracts();
    }, [user?.id]);

    const setSelectedContract = (contract: Contract) => {
        setSelectedContractState(contract);
    };

    return (
        <ContractContext.Provider
            value={{
                contracts,
                selectedContract,
                selectedContractId: selectedContract?.id || null,
                setSelectedContract,
                loading,
                hasUserSelectedContract,
                setHasUserSelectedContract,
                refreshContracts: async () => {
                    if (user?.id) {
                        setLoading(true);
                        try {
                            const response = await ixcApi.getClientContracts(user.id);
                            const contractsList = Array.isArray(response) ? response : [];
                            setContracts(contractsList);

                            // Manter contrato selecionado atualizado se existir na nova lista
                            if (selectedContract) {
                                const updated = contractsList.find((c: Contract) => c.id === selectedContract.id);
                                if (updated) setSelectedContractState(updated);
                            } else if (contractsList.length > 0) {
                                const activeContract = contractsList.find((c: Contract) => c.status === 'A') || contractsList[0];
                                setSelectedContractState(activeContract || null);
                            }
                        } catch (error) {
                            console.error('Error refreshing contracts:', error);
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            }}
        >
            {children}
        </ContractContext.Provider>
    );
}

export function useContract() {
    const context = useContext(ContractContext);
    if (context === undefined) {
        throw new Error('useContract must be used within a ContractProvider');
    }
    return context;
}
