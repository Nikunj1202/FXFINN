import { Suspense } from 'react';
import { AssetManager } from '@/components/asset-manager';
export default function AssetsPage(){return <Suspense fallback={<div className="panel h-40 animate-pulse"/>}><AssetManager/></Suspense>;}
