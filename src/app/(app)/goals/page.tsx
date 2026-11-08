import { Suspense } from 'react';
import { GoalManager } from '@/components/goal-manager';
export default function GoalsPage(){return <Suspense fallback={<div className="panel h-40 animate-pulse"/>}><GoalManager/></Suspense>;}
