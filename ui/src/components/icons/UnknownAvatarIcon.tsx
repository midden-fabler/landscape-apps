import React from 'react';
import { IconProps } from './icon';

export default function UnknownAvatarIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10.837 14.007v-.13c.004-.6.06-1.076.17-1.431.112-.355.271-.64.477-.855.205-.219.455-.42.75-.602a3.47 3.47 0 0 0 .542-.412c.163-.153.29-.322.383-.507.093-.19.14-.4.14-.632a1.24 1.24 0 0 0-.185-.68 1.249 1.249 0 0 0-.497-.448 1.484 1.484 0 0 0-.691-.16 1.52 1.52 0 0 0-.671.155c-.209.1-.383.252-.522.457-.136.202-.212.46-.229.77h-1.77c.017-.63.17-1.156.458-1.58a2.705 2.705 0 0 1 1.153-.955 3.897 3.897 0 0 1 1.591-.318c.633 0 1.19.111 1.67.333.484.222.86.539 1.129.95.272.407.408.891.408 1.451 0 .378-.062.716-.184 1.015-.12.298-.29.563-.512.795-.222.232-.486.44-.79.621a3.372 3.372 0 0 0-.662.518c-.17.178-.295.389-.378.63-.08.24-.12.534-.124.886v.13h-1.656Zm.865 3.102a1.06 1.06 0 0 1-.77-.318 1.047 1.047 0 0 1-.323-.775c0-.299.107-.554.323-.766a1.06 1.06 0 0 1 .77-.318c.295 0 .55.106.766.318.219.212.328.467.328.766 0 .202-.051.386-.154.552-.1.165-.232.298-.398.397a1.044 1.044 0 0 1-.542.144ZM4 1.5h16v-3H4v3ZM22.5 4v16h3V4h-3ZM20 22.5H4v3h16v-3ZM1.5 20V4h-3v16h3ZM4 22.5A2.5 2.5 0 0 1 1.5 20h-3A5.5 5.5 0 0 0 4 25.5v-3ZM22.5 20a2.5 2.5 0 0 1-2.5 2.5v3a5.5 5.5 0 0 0 5.5-5.5h-3ZM20 1.5A2.5 2.5 0 0 1 22.5 4h3A5.5 5.5 0 0 0 20-1.5v3Zm-16-3A5.5 5.5 0 0 0-1.5 4h3A2.5 2.5 0 0 1 4 1.5v-3Z"
        className="fill-current"
      />
    </svg>
  );
}
