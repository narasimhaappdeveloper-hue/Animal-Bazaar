import type { SVGProps } from "react";
import { Dog, Cat } from 'lucide-react';
import type { AnimalCategory } from '@/lib/definitions';
import { CowIcon } from './icons/cow-icon';
import { OxIcon } from './icons/ox-icon';
import { PigIcon } from './icons/pig-icon';
import { HenIcon } from './icons/hen-icon';
import { GoatIcon } from './icons/goat-icon';
import { SheepIcon } from './icons/sheep-icon';
import { PigeonIcon } from './icons/pigeon-icon';

type AnimalIconProps = SVGProps<SVGSVGElement> & {
  category: AnimalCategory;
};

export function AnimalIcon({ category, ...props }: AnimalIconProps) {
  switch (category) {
    case 'Cow':
      return <CowIcon {...props} />;
    case 'Ox':
      return <OxIcon {...props} />;
    case 'Buffalo':
      return <CowIcon {...props} />; // Using Cow as a proxy for Buffalo
    case 'Hen':
      return <HenIcon {...props} />;
    case 'Dog':
      return <Dog {...props} />;
    case 'Cat':
      return <Cat {...props} />;
    case 'Pig':
      return <PigIcon {...props} />;
    case 'Goat':
      return <GoatIcon {...props} />;
    case 'Sheep':
        return <SheepIcon {...props} />;
    case 'Pigeon':
        return <PigeonIcon {...props} />;
    default:
      return null;
  }
}
