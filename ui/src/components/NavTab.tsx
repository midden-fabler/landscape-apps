import cn from 'classnames';
import React, { AnchorHTMLAttributes, PropsWithChildren } from 'react';
import { NavLink, NavLinkProps } from 'react-router-dom';

type NavTabProps = PropsWithChildren<
  (
    | Omit<NavLinkProps, 'className' | 'style'>
    | AnchorHTMLAttributes<HTMLAnchorElement>
  ) & {
    className?: string;
    linkClass?: string;
  }
>;

function isNavLinkProps(obj: unknown): obj is NavLinkProps {
  return !!obj && typeof obj === 'object' && 'to' in obj;
}

export default function NavTab({
  children,
  className,
  linkClass,
  ...props
}: NavTabProps) {
  return (
    <li className={cn('flex-1 text-xs font-semibold', className)}>
      {isNavLinkProps(props) ? (
        <NavLink
          {...props}
          to={props.to}
          className={cn(
            'flex h-full w-full flex-col items-center justify-center bg-white py-2 text-black',
            linkClass
          )}
        >
          {children}
        </NavLink>
      ) : (
        <a
          {...props}
          className={cn(
            'flex h-full w-full flex-col items-center justify-center bg-white p-2 text-black',
            linkClass
          )}
        >
          {children}
        </a>
      )}
    </li>
  );
}
