import { Suspense } from 'react';
import { TransactionManager } from '@/components/transaction-manager';
export default function TransactionsPage(){return <Suspense fallback={<div className="panel h-40 animate-pulse"/>}><TransactionManager/></Suspense>;}
