import React from 'react';

interface Equipment {
  id: string;
  name: string;
  image: string | null;
}

interface Props {
  equipment: Equipment;
  onClick: (name: string) => void;
}

export const EquipmentCard = ({ equipment, onClick }: Props) => (
  <div
    onClick={() => onClick(equipment.name)}
    className="group bg-[#1a1d24] rounded-3xl border border-white/5 overflow-hidden cursor-pointer hover:border-[#6ee7b7]/50 transition-all shadow-lg"
  >
    <div className="aspect-square bg-slate-800 relative overflow-hidden">
      {equipment.image ? (
        <img 
          src={equipment.image} 
          alt={equipment.name}
          className="w-full h-full object-cover opacity-60 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700"
        />
      ) : (
        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
          <span className="text-white/20 uppercase text-[10px] font-bold text-center px-2">
            Без изображения
          </span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#111318] to-transparent" />
      <div className="absolute bottom-4 left-4 right-4 text-center">
        <h3 className="font-black text-white text-sm leading-tight uppercase">
          {equipment.name}
        </h3>
      </div>
    </div>
  </div>
);
