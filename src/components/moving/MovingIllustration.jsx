import React from 'react';

const palette = {
  ink: '#17231f',
  green: '#477b69',
  mint: '#bde5d4',
  cream: '#f7f2e8',
  coral: '#ed9878',
  blue: '#91b9c9',
};

export const MovingIllustration = ({ kind = 'scene', className = '' }) => {
  if (kind === 'roommates') {
    return <svg className={className} viewBox="0 0 560 360" role="img" aria-label="Illustration of two people sharing a home">
      <defs><linearGradient id="room-bg" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#e3f3ec"/><stop offset="1" stopColor="#c8ddeb"/></linearGradient><linearGradient id="room-floor" x1="0" x2="1"><stop stopColor="#d3b494"/><stop offset="1" stopColor="#f2ddc4"/></linearGradient></defs>
      <rect width="560" height="360" rx="34" fill="url(#room-bg)"/><circle cx="456" cy="66" r="38" fill="#fff" opacity=".5"/>
      <path d="M52 285V84a18 18 0 0 1 18-18h420a18 18 0 0 1 18 18v201" fill="#f8f8f2" stroke="#fff" strokeWidth="8"/>
      <path d="M66 271h428v40H66z" fill="url(#room-floor)"/><rect x="90" y="102" width="112" height="108" rx="8" fill="#b7d7df"/><path d="M146 102v108M90 156h112" stroke="#fff" strokeWidth="8"/><path d="M84 208c35-30 76-29 122 0v16H84z" fill="#6e9f8b"/>
      <rect x="290" y="182" width="143" height="64" rx="21" fill="#d5ad87"/><rect x="278" y="222" width="167" height="34" rx="13" fill="#477b69"/><rect x="290" y="248" width="12" height="26" rx="6" fill="#6f5949"/><rect x="421" y="248" width="12" height="26" rx="6" fill="#6f5949"/>
      <circle cx="254" cy="143" r="23" fill="#8e5f48"/><path d="M232 141c1-23 37-31 45-3-11-7-24-7-45 3" fill="#242622"/><path d="M231 168c11-13 33-13 45 0l12 71h-67z" fill="#ed9878"/><path d="M241 236l-11 37M276 236l11 37" stroke="#334740" strokeWidth="13" strokeLinecap="round"/>
      <circle cx="467" cy="150" r="22" fill="#b98060"/><path d="M444 149c3-23 40-30 46-1-10-8-28-8-46 1" fill="#473932"/><path d="M444 176c12-12 34-12 46 0l10 60h-67z" fill="#91b9c9"/><path d="M455 235l-10 38M486 235l10 38" stroke="#334740" strokeWidth="13" strokeLinecap="round"/>
      <rect x="212" y="267" width="22" height="5" rx="2.5" fill="#8d7158"/><rect x="250" y="267" width="22" height="5" rx="2.5" fill="#8d7158"/><path d="M103 251v-30m0 15c-12-16-24-12-18-2m18-3c11-17 23-12 17-2" stroke="#558b72" strokeWidth="7" strokeLinecap="round"/>
    </svg>;
  }

  if (kind.startsWith('vehicle:')) {
    const vehicle = kind.split(':')[1];
    const name = { motorbike: 'Motorbike', tuk: 'Tuk tuk', pickup: 'Pickup', lorry: 'Moving lorry' }[vehicle] || 'Moving vehicle';
    return <svg className={className} viewBox="0 0 440 220" role="img" aria-label={`${name} illustration`}>
      <defs><linearGradient id={`vehicle-${vehicle}`} x1="0" x2="1" y1="0" y2="1"><stop stopColor="#e7f5ee"/><stop offset="1" stopColor="#cadcda"/></linearGradient></defs>
      <rect width="440" height="220" rx="24" fill={`url(#vehicle-${vehicle})`}/><ellipse cx="220" cy="174" rx="162" ry="17" fill="#5e786c" opacity=".13"/>
      {vehicle === 'motorbike' && <><circle cx="154" cy="159" r="23" fill="#f9faf6" stroke="#263c34" strokeWidth="9"/><circle cx="282" cy="159" r="23" fill="#f9faf6" stroke="#263c34" strokeWidth="9"/><path d="M154 159l43-43 44 0 41 43h-53l-28-34-18 34m44-43 16-24h34" fill="none" stroke="#477b69" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/><rect x="187" y="68" width="50" height="38" rx="7" fill="#ed9878"/><circle cx="249" cy="67" r="14" fill="#17231f"/></>}
      {vehicle === 'tuk' && <><circle cx="154" cy="159" r="23" fill="#f9faf6" stroke="#263c34" strokeWidth="9"/><circle cx="287" cy="159" r="23" fill="#f9faf6" stroke="#263c34" strokeWidth="9"/><path d="M130 145l20-42h115l33 42v14H133z" fill="#477b69"/><path d="M168 106v34h78v-34z" fill="#bde5d4"/><path d="M246 110l36 34h-36z" fill="#91b9c9"/><path d="M147 100h115l-9-23H163z" fill="#ed9878"/></>}
      {vehicle === 'pickup' && <><circle cx="141" cy="158" r="24" fill="#f9faf6" stroke="#263c34" strokeWidth="9"/><circle cx="302" cy="158" r="24" fill="#f9faf6" stroke="#263c34" strokeWidth="9"/><path d="M97 112h143l29 37h49v19H99z" fill="#477b69"/><path d="M239 112v37h-48v-37z" fill="#bde5d4"/><path d="M269 149h37l-29-37h-8z" fill="#91b9c9"/><path d="M110 92h116v15H110z" fill="#ed9878"/><rect x="112" y="122" width="86" height="26" rx="4" fill="#d5a876"/></>}
      {vehicle === 'lorry' && <><circle cx="128" cy="159" r="24" fill="#f9faf6" stroke="#263c34" strokeWidth="9"/><circle cx="300" cy="159" r="24" fill="#f9faf6" stroke="#263c34" strokeWidth="9"/><rect x="88" y="80" width="193" height="79" rx="10" fill="#477b69"/><path d="M281 111h56l27 34v14h-83z" fill="#ed9878"/><path d="M296 118h34l20 27h-54z" fill="#bde5d4"/><path d="M105 96h155v6H105zm0 17h155v6H105zm0 17h155v6H105" fill="#bde5d4" opacity=".45"/></>}
      <path d="M64 187h314" stroke="#91a89d" strokeWidth="3" strokeLinecap="round" opacity=".55"/>
    </svg>;
  }

  const item = kind.startsWith('item:') ? kind.split(':')[1] : 'scene';
  return <svg className={className} viewBox="0 0 480 290" role="img" aria-label={item === 'scene' ? 'Illustration of a moving truck with household belongings' : `${item} moving illustration`}>
    <defs><linearGradient id="move-sky" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#dff2e8"/><stop offset="1" stopColor="#c6dce7"/></linearGradient><linearGradient id="move-van" x1="0" x2="1"><stop stopColor="#29473c"/><stop offset="1" stopColor="#5b9078"/></linearGradient><filter id="move-shadow"><feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#28463a" floodOpacity=".15"/></filter></defs>
    <rect width="480" height="290" rx="28" fill="url(#move-sky)"/><circle cx="390" cy="58" r="30" fill="#fff" opacity=".56"/><path d="M0 215c93-31 139-13 220 2 93 17 148-23 260-6v79H0z" fill="#e9efdf"/><ellipse cx="243" cy="230" rx="185" ry="24" fill="#3c5f4e" opacity=".12"/>
    {item === 'scene' && <g filter="url(#move-shadow)"><rect x="100" y="115" width="208" height="89" rx="14" fill="url(#move-van)"/><path d="M308 144h65l42 48v12H306z" fill="#ed9878"/><path d="M324 151h39l29 35h-68z" fill="#bde5d4"/><path d="M117 130h165v8H117zm0 17h165v8H117zm0 17h165v8H117" fill="#bde5d4" opacity=".5"/><circle cx="151" cy="207" r="24" fill="#22372f"/><circle cx="151" cy="207" r="10" fill="#e8eee7"/><circle cx="354" cy="207" r="24" fill="#22372f"/><circle cx="354" cy="207" r="10" fill="#e8eee7"/><path d="M174 114h74v-38h-51l-23 38" fill="#d7a77f"/><path d="M184 108v-26h33v26" fill="#f3cf9f"/><rect x="80" y="173" width="29" height="31" rx="4" fill="#d59a65"/><path d="M80 185h29M94 173v31" stroke="#f7e3c5" strokeWidth="3"/><rect x="253" y="93" width="31" height="26" rx="4" fill="#d59a65"/><path d="M253 104h31m-16-11v26" stroke="#f7e3c5" strokeWidth="3"/></g>}
    {item !== 'scene' && <g transform="translate(118 36)" filter="url(#move-shadow)">
      {item === 'bed' && <><rect x="37" y="111" width="220" height="86" rx="14" fill="#597e70"/><rect x="52" y="85" width="91" height="44" rx="12" fill="#fffaf0"/><rect x="149" y="85" width="91" height="44" rx="12" fill="#f2e8d9"/><path d="M37 123v100m220-100v100" stroke="#795f4c" strokeWidth="12" strokeLinecap="round"/></>}
      {item === 'sofa' && <><rect x="42" y="111" width="217" height="88" rx="20" fill="#477b69"/><rect x="27" y="91" width="36" height="108" rx="17" fill="#35594a"/><rect x="238" y="91" width="36" height="108" rx="17" fill="#35594a"/><path d="M148 116v79" stroke="#bde5d4" strokeWidth="4"/><rect x="56" y="218" width="12" height="28" rx="5" fill="#785d48"/><rect x="234" y="218" width="12" height="28" rx="5" fill="#785d48"/></>}
      {item === 'box' && <><path d="M72 104l78-42 83 41-80 48z" fill="#edbd8b"/><path d="M72 104v96l81 50v-99z" fill="#d79c69"/><path d="M153 151l80-48v97l-80 50z" fill="#bd8156"/><path d="M150 62v87m0-87l42 22" stroke="#f9e0bd" strokeWidth="10"/></>}
      {item === 'fridge' && <><rect x="78" y="53" width="144" height="194" rx="15" fill="#eff4ef"/><rect x="88" y="63" width="124" height="89" rx="10" fill="#c8dfe2"/><path d="M78 159h144" stroke="#b6c9c6" strokeWidth="6"/><path d="M202 91v37m0 45v35" stroke="#78918a" strokeWidth="5" strokeLinecap="round"/><rect x="63" y="245" width="177" height="9" rx="4" fill="#91a49d"/></>}
      {item === 'tv' && <><rect x="39" y="62" width="228" height="143" rx="16" fill="#263833"/><rect x="50" y="73" width="206" height="121" rx="9" fill="#9ec8cb"/><path d="M91 194l-15 27m153-27 15 27" stroke="#263833" strokeWidth="9" strokeLinecap="round"/><path d="M122 223h76" stroke="#263833" strokeWidth="8" strokeLinecap="round"/><circle cx="153" cy="132" r="35" fill="#e7f4e6" opacity=".62"/></>}
      {item === 'chair' && <><path d="M95 65h115v74H95z" fill="#d2a57d"/><path d="M78 137h150v22H78z" fill="#477b69"/><path d="M91 158l-9 87m142-87 11 87" stroke="#795f4c" strokeWidth="13" strokeLinecap="round"/><path d="M118 158v87m75-87v87" stroke="#795f4c" strokeWidth="10" strokeLinecap="round"/></>}
      {item === 'table' && <><path d="M49 105h226v22H49z" fill="#d2a57d"/><path d="M75 127l-18 115m191-115 18 115" stroke="#795f4c" strokeWidth="13" strokeLinecap="round"/><path d="M114 127v76m95-76v76" stroke="#795f4c" strokeWidth="10" strokeLinecap="round"/><path d="M123 80h77" stroke="#ed9878" strokeWidth="12" strokeLinecap="round"/></>}
      {item === 'wardrobe' && <><rect x="71" y="43" width="164" height="207" rx="10" fill="#b9815d"/><path d="M153 43v207" stroke="#edc39b" strokeWidth="5"/><path d="M138 138v26m31-26v26" stroke="#f4e3ca" strokeWidth="5" strokeLinecap="round"/><path d="M82 239h143" stroke="#754f3d" strokeWidth="10" strokeLinecap="round"/></>}
      {item === 'washer' && <><rect x="68" y="44" width="177" height="205" rx="16" fill="#f4f7f3"/><rect x="82" y="62" width="148" height="32" rx="8" fill="#dce9e4"/><circle cx="156" cy="166" r="52" fill="#6f9890"/><circle cx="156" cy="166" r="39" fill="#c2dedb"/><path d="M126 170c16-20 43-19 61 0" stroke="#f3faf3" strokeWidth="6" fill="none" strokeLinecap="round"/></>}
      {item === 'other' && <><rect x="47" y="131" width="86" height="88" rx="10" fill="#d59a65"/><path d="M47 159h86m-43-28v88" stroke="#f7e3c5" strokeWidth="4"/><rect x="157" y="78" width="97" height="143" rx="12" fill="#91b9c9"/><circle cx="205" cy="145" r="24" fill="#eaf4ef"/><path d="M112 90h44v48h-44z" fill="#ed9878"/></>}
    </g>}
    {item === 'scene' && <><path d="M420 112v65" stroke="#56836e" strokeWidth="9" strokeLinecap="round"/><path d="M420 143c-33-39-58-13-32 0m32-10c30-34 55-7 32 9" stroke="#56836e" strokeWidth="12" strokeLinecap="round"/><circle cx="80" cy="74" r="8" fill="#fff" opacity=".8"/><circle cx="427" cy="77" r="5" fill="#fff" opacity=".8"/></>}
  </svg>;
};

export default MovingIllustration;
