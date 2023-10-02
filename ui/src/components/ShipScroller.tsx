import { Virtuoso } from 'react-virtuoso';

interface ShipScrollerProps {
  ships: string[];
  shipItem: React.FC<{ ship: string }>;
  shipLabel: string;
}

export default function ShipScroller({
  ships,
  shipItem,
  shipLabel,
}: ShipScrollerProps) {
  const ShipItem = shipItem;

  console.log({ ships });

  const thresholds = {
    atBottomThreshold: 125,
    atTopThreshold: 125,
    overscan: { main: 200, reverse: 200 },
  };

  if (ships.length === 0) {
    return <p>No {shipLabel}s</p>;
  }

  return (
    <Virtuoso
      {...thresholds}
      data={ships}
      computeItemKey={(i, ship: string) => ship}
      itemContent={(i, ship: string) => <ShipItem key={ship} ship={ship} />}
      style={{
        minHeight: '100%',
      }}
    />
  );
}
