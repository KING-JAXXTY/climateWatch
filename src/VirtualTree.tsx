import React from 'react';
import { useAuth } from './AuthContext';
import './VirtualTree.css';

const STAGES = [
  { id: 'seed',     name: 'Seed',        minLevel: 1,  emoji: '🌱', desc: 'A seed of change planted in the earth' },
  { id: 'sprout',   name: 'Sprout',      minLevel: 2,  emoji: '🌿', desc: 'First leaves reaching toward the light' },
  { id: 'seedling', name: 'Seedling',    minLevel: 4,  emoji: '🌱', desc: 'Roots growing deep and strong' },
  { id: 'sapling',  name: 'Sapling',     minLevel: 6,  emoji: '🌲', desc: 'Standing tall and growing proud' },
  { id: 'young',    name: 'Young Tree',  minLevel: 9,  emoji: '🌳', desc: 'A full canopy spreading wide' },
  { id: 'mature',   name: 'Mature Tree', minLevel: 13, emoji: '🌳', desc: 'Wide, deep-rooted, full of life' },
  { id: 'ancient',  name: 'Ancient',     minLevel: 17, emoji: '🌲', desc: 'Towering above all others' },
  { id: 'legend',   name: 'Legend',      minLevel: 21, emoji: '✨', desc: 'A living legend — glowing with life' },
] as const;


function getStageIndex(level: number): number {
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (level >= STAGES[i].minLevel) return i;
  }
  return 0;
}

const SeedSVG = () => (
  <svg viewBox="0 0 200 200" className="tree-graphic">
    <ellipse cx="100" cy="162" rx="55" ry="22" fill="#7d5c33"/>
    <ellipse cx="100" cy="155" rx="50" ry="15" fill="#8b7355"/>
    <path d="M85 154 Q83 140 81 130" stroke="#22c55e" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M93 152 Q93 136 90 124" stroke="#4ade80" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M113 155 Q115 140 117 130" stroke="#22c55e" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <ellipse cx="100" cy="136" rx="20" ry="27" fill="#92400e" transform="rotate(-8 100 136)"/>
    <ellipse cx="100" cy="136" rx="14" ry="20" fill="#78350f" transform="rotate(-8 100 136)"/>
    <ellipse cx="93" cy="131" rx="4" ry="7" fill="#a16207" opacity="0.45" transform="rotate(-8 93 131)"/>
    <path d="M102 116 Q102 106 99 99" stroke="#4ade80" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M99 99 Q94 92 92 88" stroke="#22c55e" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M99 99 Q104 92 106 88" stroke="#22c55e" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
  </svg>
);

const SproutSVG = () => (
  <svg viewBox="0 0 200 200" className="tree-graphic">
    <ellipse cx="100" cy="172" rx="60" ry="22" fill="#7d5c33"/>
    <ellipse cx="100" cy="165" rx="55" ry="16" fill="#8b7355"/>
    <path d="M78 163 Q76 147 73 135" stroke="#22c55e" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M88 161 Q88 144 86 130" stroke="#4ade80" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M118 165 Q120 149 122 137" stroke="#22c55e" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M100 164 Q102 138 100 110" stroke="#65a30d" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
    <ellipse cx="79" cy="126" rx="22" ry="14" fill="#22c55e" transform="rotate(-30 79 126)"/>
    <path d="M97 134 Q86 128 72 123" stroke="#16a34a" strokeWidth="1.5" fill="none"/>
    <ellipse cx="123" cy="120" rx="22" ry="14" fill="#22c55e" transform="rotate(30 123 120)"/>
    <path d="M103 129 Q114 123 128 118" stroke="#16a34a" strokeWidth="1.5" fill="none"/>
    <ellipse cx="92" cy="107" rx="14" ry="9" fill="#16a34a" transform="rotate(-15 92 107)"/>
    <ellipse cx="109" cy="104" rx="13" ry="8" fill="#16a34a" transform="rotate(15 109 104)"/>
    <ellipse cx="100" cy="96" rx="10" ry="12" fill="#15803d"/>
  </svg>
);

const SeedlingSVG = () => (
  <svg viewBox="0 0 200 220" className="tree-graphic">
    <ellipse cx="100" cy="190" rx="62" ry="22" fill="#7d5c33"/>
    <ellipse cx="100" cy="183" rx="57" ry="16" fill="#8b7355"/>
    <path d="M72 180 Q70 163 67 150" stroke="#22c55e" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M84 178 Q84 160 81 145" stroke="#4ade80" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M124 181 Q126 164 128 152" stroke="#22c55e" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M100 183 Q102 150 100 105" stroke="#8b6f47" strokeWidth="8" fill="none" strokeLinecap="round"/>
    <path d="M100 165 Q82 160 68 155" stroke="#8b6f47" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
    <path d="M100 165 Q118 160 132 155" stroke="#8b6f47" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
    <ellipse cx="64" cy="153" rx="21" ry="16" fill="#22c55e"/>
    <ellipse cx="136" cy="151" rx="21" ry="16" fill="#22c55e"/>
    <ellipse cx="74" cy="130" rx="23" ry="17" fill="#16a34a"/>
    <ellipse cx="126" cy="128" rx="23" ry="17" fill="#16a34a"/>
    <ellipse cx="82" cy="112" rx="20" ry="15" fill="#15803d"/>
    <ellipse cx="118" cy="110" rx="20" ry="15" fill="#15803d"/>
    <ellipse cx="100" cy="100" rx="28" ry="21" fill="#14532d"/>
    <ellipse cx="100" cy="89" rx="22" ry="17" fill="#166534"/>
  </svg>
);

const SaplingSVG = () => (
  <svg viewBox="0 0 240 260" className="tree-graphic">
    <ellipse cx="120" cy="232" rx="72" ry="22" fill="#7d5c33"/>
    <ellipse cx="120" cy="225" rx="66" ry="16" fill="#8b7355"/>
    <path d="M82 222 Q80 204 77 190" stroke="#22c55e" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M96 220 Q96 201 93 185" stroke="#4ade80" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M152 223 Q154 206 156 192" stroke="#22c55e" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M120 226 Q123 182 121 120" stroke="#8b6f47" strokeWidth="11" fill="none" strokeLinecap="round"/>
    <path d="M121 202 Q95 193 72 186" stroke="#8b6f47" strokeWidth="7" fill="none" strokeLinecap="round"/>
    <path d="M121 202 Q148 192 171 185" stroke="#8b6f47" strokeWidth="7" fill="none" strokeLinecap="round"/>
    <path d="M121 171 Q97 160 78 153" stroke="#8b6f47" strokeWidth="5.5" fill="none" strokeLinecap="round"/>
    <path d="M121 171 Q145 160 164 153" stroke="#8b6f47" strokeWidth="5.5" fill="none" strokeLinecap="round"/>
    <ellipse cx="66" cy="182" rx="26" ry="21" fill="#22c55e"/>
    <ellipse cx="56" cy="174" rx="18" ry="14" fill="#16a34a"/>
    <ellipse cx="174" cy="180" rx="26" ry="21" fill="#22c55e"/>
    <ellipse cx="184" cy="172" rx="18" ry="14" fill="#16a34a"/>
    <ellipse cx="72" cy="148" rx="24" ry="19" fill="#16a34a"/>
    <ellipse cx="168" cy="146" rx="24" ry="19" fill="#16a34a"/>
    <ellipse cx="120" cy="134" rx="42" ry="33" fill="#15803d"/>
    <ellipse cx="98" cy="116" rx="28" ry="22" fill="#16a34a"/>
    <ellipse cx="142" cy="113" rx="28" ry="22" fill="#16a34a"/>
    <ellipse cx="120" cy="100" rx="36" ry="28" fill="#14532d"/>
    <ellipse cx="120" cy="87" rx="28" ry="22" fill="#166534"/>
  </svg>
);

const YoungTreeSVG = () => (
  <svg viewBox="0 0 260 280" className="tree-graphic">
    <ellipse cx="130" cy="252" rx="80" ry="24" fill="#7d5c33"/>
    <ellipse cx="130" cy="245" rx="73" ry="17" fill="#8b7355"/>
    <path d="M88 242 Q86 224 83 209" stroke="#22c55e" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M103 240 Q103 220 100 204" stroke="#4ade80" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M164 243 Q166 225 168 211" stroke="#22c55e" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M122 250 Q116 265 108 278" stroke="#7d5c33" strokeWidth="6" fill="none" strokeLinecap="round"/>
    <path d="M138 251 Q144 266 152 278" stroke="#7d5c33" strokeWidth="6" fill="none" strokeLinecap="round"/>
    <path d="M130 246 Q134 190 131 92" stroke="#8b6f47" strokeWidth="15" fill="none" strokeLinecap="round"/>
    <path d="M131 218 Q98 205 66 196" stroke="#7d5934" strokeWidth="10" fill="none" strokeLinecap="round"/>
    <path d="M131 218 Q164 204 196 195" stroke="#7d5934" strokeWidth="10" fill="none" strokeLinecap="round"/>
    <path d="M131 183 Q101 169 74 159" stroke="#7d5934" strokeWidth="8" fill="none" strokeLinecap="round"/>
    <path d="M131 183 Q161 168 188 158" stroke="#7d5934" strokeWidth="8" fill="none" strokeLinecap="round"/>
    <path d="M131 148 Q110 136 93 128" stroke="#7d5934" strokeWidth="6" fill="none" strokeLinecap="round"/>
    <path d="M131 148 Q152 136 169 128" stroke="#7d5934" strokeWidth="6" fill="none" strokeLinecap="round"/>
    <ellipse cx="57" cy="188" rx="32" ry="26" fill="#22c55e"/>
    <ellipse cx="43" cy="178" rx="22" ry="18" fill="#16a34a"/>
    <ellipse cx="203" cy="185" rx="32" ry="26" fill="#22c55e"/>
    <ellipse cx="217" cy="175" rx="22" ry="18" fill="#16a34a"/>
    <ellipse cx="65" cy="150" rx="30" ry="24" fill="#16a34a"/>
    <ellipse cx="195" cy="148" rx="30" ry="24" fill="#16a34a"/>
    <ellipse cx="84" cy="120" rx="28" ry="22" fill="#15803d"/>
    <ellipse cx="176" cy="118" rx="28" ry="22" fill="#15803d"/>
    <ellipse cx="130" cy="108" rx="52" ry="42" fill="#15803d"/>
    <ellipse cx="107" cy="88" rx="34" ry="28" fill="#166534"/>
    <ellipse cx="153" cy="85" rx="34" ry="28" fill="#166534"/>
    <ellipse cx="130" cy="70" rx="44" ry="35" fill="#14532d"/>
    <ellipse cx="130" cy="54" rx="34" ry="28" fill="#166534"/>
  </svg>
);

const MatureTreeSVG = () => (
  <svg viewBox="0 0 280 290" className="tree-graphic">
    <ellipse cx="140" cy="262" rx="90" ry="24" fill="#7d5c33"/>
    <ellipse cx="140" cy="255" rx="82" ry="17" fill="#8b7355"/>
    <path d="M94 252 Q92 233 89 217" stroke="#22c55e" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M110 250 Q110 230 107 213" stroke="#4ade80" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M176 253 Q178 234 180 219" stroke="#22c55e" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M130 260 Q116 270 104 282" stroke="#7d5934" strokeWidth="8" fill="none" strokeLinecap="round"/>
    <path d="M150 261 Q164 271 176 283" stroke="#7d5934" strokeWidth="8" fill="none" strokeLinecap="round"/>
    <path d="M136 262 Q122 274 112 288" stroke="#7d5934" strokeWidth="5" fill="none" strokeLinecap="round"/>
    <path d="M133 257 Q137 196 134 82" stroke="#6d4c1f" strokeWidth="20" fill="none" strokeLinecap="round"/>
    <path d="M147 258 Q143 196 146 82" stroke="#8b6f47" strokeWidth="14" fill="none" strokeLinecap="round"/>
    <path d="M132 228 Q92 213 56 202" stroke="#6d4c1f" strokeWidth="12" fill="none" strokeLinecap="round"/>
    <path d="M148 228 Q188 213 224 201" stroke="#6d4c1f" strokeWidth="12" fill="none" strokeLinecap="round"/>
    <path d="M132 192 Q95 177 62 165" stroke="#6d4c1f" strokeWidth="10" fill="none" strokeLinecap="round"/>
    <path d="M148 192 Q185 177 218 165" stroke="#6d4c1f" strokeWidth="10" fill="none" strokeLinecap="round"/>
    <path d="M133 157 Q107 143 84 133" stroke="#6d4c1f" strokeWidth="8" fill="none" strokeLinecap="round"/>
    <path d="M147 157 Q173 143 196 133" stroke="#6d4c1f" strokeWidth="8" fill="none" strokeLinecap="round"/>
    <ellipse cx="45" cy="192" rx="37" ry="29" fill="#22c55e"/>
    <ellipse cx="29" cy="180" rx="24" ry="20" fill="#16a34a"/>
    <ellipse cx="235" cy="189" rx="37" ry="29" fill="#22c55e"/>
    <ellipse cx="251" cy="177" rx="24" ry="20" fill="#16a34a"/>
    <ellipse cx="52" cy="155" rx="35" ry="28" fill="#16a34a"/>
    <ellipse cx="228" cy="152" rx="35" ry="28" fill="#16a34a"/>
    <ellipse cx="76" cy="124" rx="32" ry="26" fill="#15803d"/>
    <ellipse cx="204" cy="121" rx="32" ry="26" fill="#15803d"/>
    <ellipse cx="140" cy="112" rx="68" ry="54" fill="#16a34a"/>
    <ellipse cx="110" cy="88" rx="44" ry="36" fill="#15803d"/>
    <ellipse cx="170" cy="85" rx="44" ry="36" fill="#15803d"/>
    <ellipse cx="140" cy="68" rx="54" ry="43" fill="#14532d"/>
    <ellipse cx="116" cy="48" rx="36" ry="29" fill="#166534"/>
    <ellipse cx="164" cy="45" rx="36" ry="29" fill="#166534"/>
    <ellipse cx="140" cy="32" rx="42" ry="33" fill="#15803d"/>
    <circle cx="72" cy="145" r="5" fill="#fbbf24" opacity="0.85"/>
    <circle cx="208" cy="142" r="5" fill="#fbbf24" opacity="0.85"/>
    <circle cx="112" cy="42" r="4" fill="#f9a8d4"/>
    <circle cx="168" cy="39" r="4" fill="#f9a8d4"/>
  </svg>
);

const AncientTreeSVG = () => (
  <svg viewBox="-18 -28 336 346" className="tree-graphic">
    <ellipse cx="150" cy="268" rx="100" ry="24" fill="#6b4f2a"/>
    <ellipse cx="150" cy="260" rx="92" ry="17" fill="#7d5c33"/>
    <path d="M100 256 Q98 237 95 221" stroke="#22c55e" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M116 255 Q116 235 113 219" stroke="#4ade80" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M190 258 Q192 239 194 223" stroke="#22c55e" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M136 264 Q114 274 92 286" stroke="#6d4c1f" strokeWidth="9" fill="none" strokeLinecap="round"/>
    <path d="M164 264 Q186 274 208 286" stroke="#6d4c1f" strokeWidth="9" fill="none" strokeLinecap="round"/>
    <path d="M140 266 Q120 278 108 292" stroke="#6d4c1f" strokeWidth="5.5" fill="none" strokeLinecap="round"/>
    <path d="M160 266 Q180 278 192 292" stroke="#6d4c1f" strokeWidth="5.5" fill="none" strokeLinecap="round"/>
    <path d="M140 260 Q144 194 141 72" stroke="#6d4c1f" strokeWidth="24" fill="none" strokeLinecap="round"/>
    <path d="M160 260 Q156 194 159 72" stroke="#8b6f47" strokeWidth="17" fill="none" strokeLinecap="round"/>
    <path d="M150 256 Q150 194 150 76" stroke="#a07840" strokeWidth="7" fill="none" strokeLinecap="round" opacity="0.4"/>
    <path d="M141 232 Q94 215 48 201" stroke="#6d4c1f" strokeWidth="15" fill="none" strokeLinecap="round"/>
    <path d="M159 232 Q206 214 252 200" stroke="#6d4c1f" strokeWidth="15" fill="none" strokeLinecap="round"/>
    <path d="M140 194 Q95 177 52 163" stroke="#6d4c1f" strokeWidth="12" fill="none" strokeLinecap="round"/>
    <path d="M160 194 Q205 177 248 162" stroke="#6d4c1f" strokeWidth="12" fill="none" strokeLinecap="round"/>
    <path d="M141 157 Q108 142 80 130" stroke="#6d4c1f" strokeWidth="9" fill="none" strokeLinecap="round"/>
    <path d="M159 157 Q192 142 220 130" stroke="#6d4c1f" strokeWidth="9" fill="none" strokeLinecap="round"/>
    <ellipse cx="36" cy="190" rx="42" ry="33" fill="#22c55e"/>
    <ellipse cx="18" cy="177" rx="28" ry="23" fill="#16a34a"/>
    <ellipse cx="264" cy="187" rx="42" ry="33" fill="#22c55e"/>
    <ellipse cx="282" cy="174" rx="28" ry="23" fill="#16a34a"/>
    <ellipse cx="42" cy="153" rx="40" ry="32" fill="#16a34a"/>
    <ellipse cx="258" cy="150" rx="40" ry="32" fill="#16a34a"/>
    <ellipse cx="70" cy="122" rx="37" ry="30" fill="#15803d"/>
    <ellipse cx="230" cy="119" rx="37" ry="30" fill="#15803d"/>
    <ellipse cx="150" cy="108" rx="80" ry="65" fill="#16a34a"/>
    <ellipse cx="112" cy="82" rx="50" ry="40" fill="#15803d"/>
    <ellipse cx="188" cy="79" rx="50" ry="40" fill="#15803d"/>
    <ellipse cx="150" cy="62" rx="64" ry="50" fill="#14532d"/>
    <ellipse cx="122" cy="40" rx="42" ry="33" fill="#166534"/>
    <ellipse cx="178" cy="37" rx="42" ry="33" fill="#166534"/>
    <ellipse cx="150" cy="22" rx="50" ry="38" fill="#15803d"/>
    <ellipse cx="150" cy="10" rx="38" ry="28" fill="#166534"/>
    <circle cx="56" cy="142" r="5.5" fill="#fbbf24" opacity="0.9"/>
    <circle cx="244" cy="139" r="5.5" fill="#fbbf24" opacity="0.9"/>
    <circle cx="104" cy="74" r="4.5" fill="#f9a8d4"/>
    <circle cx="196" cy="71" r="4.5" fill="#f9a8d4"/>
    <circle cx="150" cy="6" r="4.5" fill="#86efac"/>
    <circle cx="128" cy="34" r="4" fill="#fde68a"/>
    <circle cx="172" cy="31" r="4" fill="#fde68a"/>
    <path d="M66 68 Q71 63 76 68 Q79 62 84 66" stroke="#334155" strokeWidth="1.5" fill="none"/>
    <path d="M218 66 Q223 61 228 66 Q231 60 236 64" stroke="#334155" strokeWidth="1.5" fill="none"/>
  </svg>
);

const LegendTreeSVG = () => (
  <svg viewBox="-28 -32 356 362" className="tree-graphic">
    <ellipse cx="150" cy="150" rx="134" ry="134" fill="none" stroke="#ffd700" strokeWidth="1" opacity="0.12"/>
    <ellipse cx="150" cy="150" rx="112" ry="112" fill="none" stroke="#ffd700" strokeWidth="1" opacity="0.08"/>
    <ellipse cx="150" cy="270" rx="110" ry="24" fill="#5c4020"/>
    <ellipse cx="150" cy="263" rx="100" ry="17" fill="#6d4c28"/>
    <ellipse cx="150" cy="259" rx="92" ry="12" fill="#166534" opacity="0.5"/>
    <ellipse cx="105" cy="260" rx="9" ry="5" fill="#dc2626" opacity="0.8"/>
    <ellipse cx="105" cy="254" rx="13" ry="7" fill="#ef4444"/>
    <circle cx="103" cy="252" r="1.5" fill="white" opacity="0.8"/>
    <circle cx="108" cy="249" r="1" fill="white" opacity="0.8"/>
    <ellipse cx="195" cy="261" rx="8" ry="4" fill="#9333ea" opacity="0.8"/>
    <ellipse cx="195" cy="256" rx="11" ry="6" fill="#a855f7"/>
    <path d="M133 265 Q111 275 88 287" stroke="#8b6237" strokeWidth="10" fill="none" strokeLinecap="round"/>
    <path d="M167 265 Q189 275 212 287" stroke="#8b6237" strokeWidth="10" fill="none" strokeLinecap="round"/>
    <path d="M138 268 Q118 280 106 293" stroke="#8b6237" strokeWidth="6" fill="none" strokeLinecap="round"/>
    <path d="M162 268 Q182 280 194 293" stroke="#8b6237" strokeWidth="6" fill="none" strokeLinecap="round"/>
    <path d="M138 262 Q142 194 139 70" stroke="#6d4c1f" strokeWidth="25" fill="none" strokeLinecap="round"/>
    <path d="M162 262 Q158 194 161 70" stroke="#8b6f47" strokeWidth="18" fill="none" strokeLinecap="round"/>
    <path d="M150 258 Q150 194 150 74" stroke="#d97706" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.35"/>
    <path d="M139 236 Q90 218 44 204" stroke="#6d4c1f" strokeWidth="16" fill="none" strokeLinecap="round"/>
    <path d="M161 236 Q210 217 256 203" stroke="#6d4c1f" strokeWidth="16" fill="none" strokeLinecap="round"/>
    <path d="M138 196 Q90 178 46 163" stroke="#6d4c1f" strokeWidth="13" fill="none" strokeLinecap="round"/>
    <path d="M162 196 Q210 178 254 162" stroke="#6d4c1f" strokeWidth="13" fill="none" strokeLinecap="round"/>
    <path d="M139 158 Q104 143 76 130" stroke="#6d4c1f" strokeWidth="10" fill="none" strokeLinecap="round"/>
    <path d="M161 158 Q196 143 224 130" stroke="#6d4c1f" strokeWidth="10" fill="none" strokeLinecap="round"/>
    <ellipse cx="30" cy="193" rx="44" ry="35" fill="#16a34a"/>
    <ellipse cx="12" cy="179" rx="29" ry="24" fill="#15803d"/>
    <ellipse cx="270" cy="190" rx="44" ry="35" fill="#16a34a"/>
    <ellipse cx="288" cy="176" rx="29" ry="24" fill="#15803d"/>
    <ellipse cx="36" cy="153" rx="42" ry="34" fill="#15803d"/>
    <ellipse cx="264" cy="150" rx="42" ry="34" fill="#15803d"/>
    <ellipse cx="66" cy="120" rx="40" ry="32" fill="#14532d"/>
    <ellipse cx="234" cy="117" rx="40" ry="32" fill="#14532d"/>
    <ellipse cx="150" cy="106" rx="84" ry="68" fill="#15803d"/>
    <ellipse cx="110" cy="80" rx="52" ry="42" fill="#14532d"/>
    <ellipse cx="190" cy="77" rx="52" ry="42" fill="#14532d"/>
    <ellipse cx="150" cy="60" rx="66" ry="52" fill="#166534"/>
    <ellipse cx="118" cy="38" rx="44" ry="35" fill="#15803d"/>
    <ellipse cx="182" cy="35" rx="44" ry="35" fill="#15803d"/>
    <ellipse cx="150" cy="20" rx="52" ry="40" fill="#166534"/>
    <ellipse cx="150" cy="8" rx="38" ry="28" fill="#14532d"/>
    <circle cx="58" cy="142" r="7" fill="#fbbf24"/>
    <circle cx="242" cy="139" r="7" fill="#fbbf24"/>
    <circle cx="94" cy="112" r="6" fill="#f59e0b"/>
    <circle cx="206" cy="110" r="6" fill="#f59e0b"/>
    <circle cx="116" cy="72" r="5.5" fill="#fbbf24"/>
    <circle cx="184" cy="69" r="5.5" fill="#fbbf24"/>
    <circle cx="150" cy="2" r="6" fill="#fbbf24"/>
    <circle cx="28" cy="182" r="4.5" fill="#f9a8d4"/>
    <circle cx="272" cy="179" r="4.5" fill="#f9a8d4"/>
    <circle cx="128" cy="31" r="4.5" fill="#fbcfe8"/>
    <circle cx="172" cy="28" r="4.5" fill="#fbcfe8"/>
    <path d="M22 142 L24.5 136 L27 142 L33 144 L27 146 L24.5 152 L22 146 L16 144 Z" fill="#ffd700" opacity="0.85"/>
    <path d="M267 140 L269.5 134 L272 140 L278 142 L272 144 L269.5 150 L267 144 L261 142 Z" fill="#ffd700" opacity="0.85"/>
    <path d="M52 58 Q57 52 62 58 Q65 51 71 55" stroke="#1e293b" strokeWidth="1.5" fill="none"/>
    <path d="M228 56 Q233 50 238 56 Q241 49 247 53" stroke="#1e293b" strokeWidth="1.5" fill="none"/>
  </svg>
);

const VirtualTree: React.FC = () => {
  const { user } = useAuth();
  const totalPoints = user?.points || 0;
  const currentLevel = user?.level || 1;
  const nextLevelPoints = currentLevel * 500;
  const progressToNextLevel = ((totalPoints % 500) / 500) * 100;

  const stageIndex = getStageIndex(currentLevel);
  const stage = STAGES[stageIndex];

  const [previewIdx, setPreviewIdx] = React.useState<number | null>(null);
  const displayIdx = previewIdx ?? stageIndex;
  const displayStage = STAGES[displayIdx];
  const isPreviewingLocked = displayIdx > stageIndex;

  const renderTree = (id: string) => {
    switch (id) {
      case 'seed':     return <SeedSVG />;
      case 'sprout':   return <SproutSVG />;
      case 'seedling': return <SeedlingSVG />;
      case 'sapling':  return <SaplingSVG />;
      case 'young':    return <YoungTreeSVG />;
      case 'mature':   return <MatureTreeSVG />;
      case 'ancient':  return <AncientTreeSVG />;
      case 'legend':   return <LegendTreeSVG />;
    }
  };

  const leafCount = displayIdx >= 6 ? 12 : displayIdx >= 3 ? 7 : 0;

  return (
    <div className="virtual-tree-container">
      <div className="tree-header">
        <h1>Your <span className="tree-title-accent">Virtual Tree</span></h1>
        <p>Watch your tree grow as you take climate action</p>
      </div>

      <div className="tree-main">
        <div className={`tree-scene-card tree-scene-${displayStage.id}`}>
          <div className="tree-scene-sky" />
          {Array.from({ length: leafCount }, (_, i) => (
            <div
              key={i}
              className="tree-leaf"
              style={{
                '--leaf-x': `${10 + (i * 19 + 7) % 78}%`,
                '--leaf-delay': `${(i * 0.9) % 5}s`,
                '--leaf-duration': `${4 + (i * 0.7) % 4}s`,
                '--leaf-rotate': `${(i * 37) % 360}deg`,
              } as React.CSSProperties}
            />
          ))}
          {displayStage.id === 'legend' && Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="tree-firefly"
              style={{
                '--ff-x': `${15 + (i * 14) % 70}%`,
                '--ff-y': `${20 + (i * 13) % 60}%`,
                '--ff-delay': `${i * 0.8}s`,
              } as React.CSSProperties}
            />
          ))}
          <div className={`tree-svg-wrap tree-stage-${displayStage.id}`}>{renderTree(displayStage.id)}</div>
          <div className="tree-scene-ground" />
          {isPreviewingLocked && (
            <div className="tree-preview-overlay">
              <div className="tree-preview-lock">🔒</div>
              <div className="tree-preview-label">Preview</div>
              <div className="tree-preview-req">Reach Level {displayStage.minLevel}</div>
            </div>
          )}
          <div className="tree-stage-badge">
            <span>{displayStage.emoji}</span>
            <span>{displayStage.name}</span>
            {isPreviewingLocked && <span className="tree-preview-tag">Preview</span>}
          </div>
        </div>

        <div className="tree-info">
          <div className="tree-level-card">
            <div className="tree-level-orb">
              <div className="tree-level-num">{currentLevel}</div>
              <div className="tree-level-lbl">Level</div>
            </div>
            <div className="tree-level-details">
              <div className="tree-stage-title">{stage.name}</div>
              <div className="tree-stage-desc">{stage.desc}</div>
            </div>
          </div>

          <div className="tree-progress-card">
            <div className="tree-progress-top">
              <span>Progress to Level {currentLevel + 1}</span>
              <span className="tree-progress-pct">{Math.round(progressToNextLevel)}%</span>
            </div>
            <div className="tree-progress-bar">
              <div className="tree-progress-fill" style={{ width: `${progressToNextLevel}%` }} />
            </div>
            <div className="tree-progress-pts">
              {totalPoints.toLocaleString()} / {nextLevelPoints.toLocaleString()} points
            </div>
          </div>

          <div className="tree-stats-row">
            <div className="tree-stat-box">
              <div className="tree-stat-num">{totalPoints.toLocaleString()}</div>
              <div className="tree-stat-lbl">Total Points</div>
            </div>
            <div className="tree-stat-box">
              <div className="tree-stat-num">{(totalPoints * 0.1).toFixed(1)}kg</div>
              <div className="tree-stat-lbl">CO₂ Saved</div>
            </div>
            <div className="tree-stat-box">
              <div className="tree-stat-num">
                {stageIndex + 1}<span style={{ fontSize: '0.7em', opacity: 0.6 }}>/8</span>
              </div>
              <div className="tree-stat-lbl">Stage</div>
            </div>
          </div>

          {stageIndex < STAGES.length - 1 && (
            <div className="tree-next-stage">
              <div className="tree-next-label">
                Next: <strong>{STAGES[stageIndex + 1].name}</strong>
                <span className="tree-next-level"> at Level {STAGES[stageIndex + 1].minLevel}</span>
              </div>
              <div className="tree-next-bar">
                <div
                  className="tree-next-fill"
                  style={{
                    width: `${Math.min(100, ((currentLevel - STAGES[stageIndex].minLevel) / (STAGES[stageIndex + 1].minLevel - STAGES[stageIndex].minLevel)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="tree-journey">
        <div className="tree-journey-header">
          <h2>Growth Journey</h2>
          {previewIdx !== null && (
            <button className="tree-journey-reset" onClick={() => setPreviewIdx(null)}>
              ← Back to current
            </button>
          )}
        </div>
        <div className="journey-scroll">
          {STAGES.map((s, i) => (
            <React.Fragment key={s.id}>
              <div
                className={`journey-node${i < stageIndex ? ' done' : ''}${i === stageIndex ? ' current' : ''}${i > stageIndex ? ' locked' : ''}${displayIdx === i ? ' selected' : ''}`}
                onClick={() => setPreviewIdx(i === (previewIdx ?? stageIndex) && i === stageIndex ? null : i)}
                title={i > stageIndex ? `Preview: ${s.name} (Level ${s.minLevel})` : s.name}
              >
                <div className="journey-dot">{i < stageIndex ? '✓' : s.emoji}</div>
                <div className="journey-name">{s.name}</div>
                <div className="journey-level">Lv {s.minLevel}</div>
                {i > stageIndex && <div className="journey-lock-icon">🔒</div>}
              </div>
              {i < STAGES.length - 1 && (
                <div className={`journey-line${i < stageIndex ? ' done' : ''}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VirtualTree;
