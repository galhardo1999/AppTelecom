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
}

const ContractContext = createContext<ContractContextType | undefined>(undefined);

export function ContractProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [selectedContract, setSelectedContractState] = useState<Contract | null>(null);
    const [loading, setLoading] = useState(true);

    // Carregar contratos quando o usuário mudar
    useEffect(() => {
        const loadContracts = async () => {
            if (!user?.id) {
                setContracts([]);
                setSelectedContractState(null);
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
