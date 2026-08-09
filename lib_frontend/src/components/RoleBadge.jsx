import React from 'react';

export default function RoleBadge({ role }) {
  if (!role) return null;
  
  const roleUpper = role.toUpperCase();
  
  let colors = 'bg-slate-100 text-slate-700';
  if (roleUpper === 'STAFF') colors = 'bg-emerald-100 text-emerald-700';
  else if (roleUpper === 'STUDENT') colors = 'bg-blue-100 text-blue-700';
  else if (roleUpper === 'ADMIN') colors = 'bg-purple-100 text-purple-700';

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider ml-2 align-middle ${colors}`}>
      {roleUpper}
    </span>
  );
}
