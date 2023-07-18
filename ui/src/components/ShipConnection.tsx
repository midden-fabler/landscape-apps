import cn from 'classnames';
import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { ConnectionStatus } from '../state/vitals';
import {
  getConnectionColor,
  getCompletedText,
  getPendingText,
} from '../logic/utils';
import Bullet16Icon from './icons/Bullet16Icon';

interface ShipConnectionProps {
  ship: string;
  status?: ConnectionStatus;
  showBullet?: boolean;
  showText?: boolean;
  className?: string;
}

export default function ShipConnection({
  status,
  ship,
  showBullet = true,
  showText = true,
  className,
}: ShipConnectionProps) {
  return (
    <span className={cn('flex space-x-1 font-semibold', className)}>
      {showBullet && (
        <Tooltip.Provider>
          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger>
              <Bullet16Icon
                className={cn('h-4 w-4', getConnectionColor(status))}
              />
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content asChild>
                <div className="pointer-events-none z-50 w-fit cursor-none rounded bg-gray-800 px-3 py-1 font-semibold text-white">
                  {!status
                    ? 'No connection data'
                    : 'pending' in status
                    ? getPendingText(status, ship)
                    : getCompletedText(status, ship)}
                  <Tooltip.Arrow asChild>
                    <svg
                      width="17"
                      height="8"
                      viewBox="0 0 17 8"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M16.5 0L0.5 0L7.08579 6.58579C7.86684 7.36684 9.13316 7.36684 9.91421 6.58579L16.5 0Z"
                        className="fill-gray-800"
                      />
                    </svg>
                  </Tooltip.Arrow>
                </div>
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      )}{' '}
      {showText && (
        <span>
          {!status
            ? 'No connection data'
            : 'pending' in status
            ? getPendingText(status, ship)
            : getCompletedText(status, ship)}
        </span>
      )}
    </span>
  );
}
