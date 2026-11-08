import { Suspense } from 'react';
import { LiabilityManager } from '@/components/liability-manager';
export default function LiabilitiesPage(){return <Suspense fallback={<div className="panel h-40 animate-pulse"/>}><LiabilityManager/></Suspense>;}
