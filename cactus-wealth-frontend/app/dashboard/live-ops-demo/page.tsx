/**
 * 🚀 LIVE-OPS DEMO PAGE
 *
 * Página dedicada para demostrar todas las capacidades de Live-Ops
 * Accesible desde /dashboard/live-ops-demo
 */

import { LiveOpsDemo } from '@/components/realtime/LiveOpsDemo';

export default function LiveOpsDemoPage() {
  return (
    <div className='min-h-screen bg-gray-50'>
      <LiveOpsDemo />
    </div>
  );
}
