import { motion } from 'framer-motion';

// ─── Primitive ────────────────────────────────────────────────────────────────

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
}

export const Skeleton = ({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonProps) => (
  <motion.div
    animate={{ opacity: [0.5, 1, 0.5] }}
    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    className="bg-[#f0f0f0] dark:bg-[#1a1a1a]"
    style={{
      width,
      height,
      borderRadius,
      ...style,
    }}
  />
);

// ─── Screen skeletons ─────────────────────────────────────────────────────────

export const HomeScreenSkeleton = () => (
  <div style={{ padding: '20px' }}>
    {/* Stats row */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
      <Skeleton height={80} borderRadius={14} />
      <Skeleton height={80} borderRadius={14} />
      <Skeleton height={80} borderRadius={14} />
    </div>
    {/* Week strip */}
    <Skeleton height={80} borderRadius={14} style={{ marginBottom: 14 }} />
    {/* Chart */}
    <Skeleton height={120} borderRadius={14} style={{ marginBottom: 14 }} />
    {/* Start workout CTA */}
    <Skeleton height={72} borderRadius={14} style={{ marginBottom: 14 }} />
    {/* Recent cards */}
    <Skeleton height={80} borderRadius={14} style={{ marginBottom: 10 }} />
    <Skeleton height={80} borderRadius={14} style={{ marginBottom: 10 }} />
    <Skeleton height={80} borderRadius={14} />
  </div>
);

export const HistoryScreenSkeleton = () => (
  <div style={{ padding: '0 20px' }}>
    <Skeleton height={100} borderRadius={14} style={{ marginBottom: 16 }} />
    {[1, 2, 3, 4].map((i) => (
      <Skeleton key={i} height={110} borderRadius={14} style={{ marginBottom: 10 }} />
    ))}
  </div>
);

export const StatsScreenSkeleton = () => (
  <div style={{ padding: '0 20px' }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 14 }}>
      <Skeleton height={90} borderRadius={14} />
      <Skeleton height={90} borderRadius={14} />
      <Skeleton height={90} borderRadius={14} />
      <Skeleton height={90} borderRadius={14} />
    </div>
    <Skeleton height={160} borderRadius={14} style={{ marginBottom: 14 }} />
    <Skeleton height={140} borderRadius={14} style={{ marginBottom: 14 }} />
    {[1, 2, 3].map((i) => (
      <Skeleton key={i} height={70} borderRadius={14} style={{ marginBottom: 10 }} />
    ))}
  </div>
);

export const ProfileScreenSkeleton = () => (
  <div>
    <div style={{ padding: '52px 20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <Skeleton width={80} height={80} borderRadius="50%" />
      <Skeleton width={120} height={20} borderRadius={8} />
      <Skeleton width={160} height={14} borderRadius={8} />
      <div style={{ display: 'flex', gap: 32 }}>
        <Skeleton width={60} height={40} borderRadius={8} />
        <Skeleton width={60} height={40} borderRadius={8} />
        <Skeleton width={60} height={40} borderRadius={8} />
      </div>
    </div>
    <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Skeleton height={200} borderRadius={14} />
      <Skeleton height={180} borderRadius={14} />
    </div>
  </div>
);
