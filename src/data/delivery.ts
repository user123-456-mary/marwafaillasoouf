export interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
}

export const DELIVERY_ZONES: DeliveryZone[] = [
  { id: 'agdal', name: 'Agdal', fee: 11 },
  { id: 'akari', name: 'Akari', fee: 15 },
  { id: 'hassan', name: 'Hassan', fee: 17 },
  { id: 'ocean', name: 'Océan', fee: 18 },
  { id: 'yakoub-el-mansour', name: 'Yakoub El Mansour', fee: 18 },
  { id: 'mabella', name: 'Mabella', fee: 19 },
  { id: 'hay-riad', name: 'Hay Riad', fee: 20 },
  { id: 'takadoum', name: 'Takadoum', fee: 20 },
  { id: 'hay-el-fath', name: 'Hay El Fath', fee: 22 },
  { id: 'megamall', name: 'Megamall', fee: 22 },
  { id: 'soussi-1', name: 'Soussi 1', fee: 22 },
  { id: 'hay-ennahda-1', name: 'Hay Ennahda 1', fee: 23 },
  { id: 'hay-ennahda-2', name: 'Hay Ennahda 2', fee: 24 },
  { id: 'soussi-2', name: 'Soussi 2', fee: 24 },
  { id: 'les-orangeries', name: 'Les Orangeries', fee: 27 },
  { id: 'marina', name: 'Marina', fee: 30 },
  { id: 'ouled-mtaa', name: 'Ouled Mtaa', fee: 30 },
  { id: 'sale-tabriket', name: 'Salé Tabriket', fee: 38 },
  { id: 'harhoura', name: 'Harhoura', fee: 39 },
  { id: 'temara', name: 'Témara', fee: 39 },
  { id: 'sale-jdida', name: 'Salé Jdida', fee: 43 },
  { id: 'valdor', name: 'Val d\'Or', fee: 44 },
  { id: 'maamora', name: 'Maamora', fee: 47 },
  { id: 'technopolis', name: 'Technopolis', fee: 48 },
  { id: 'airport-sale', name: 'Airport Salé', fee: 49 },
  { id: 'mers-lkhir', name: 'Mers El Kheir', fee: 57 },
  { id: 'tamsna', name: 'Tamesna', fee: 59 },
  { id: 'skhirat', name: 'Skhirat', fee: 60 },
  { id: 'bouknadel', name: 'Bouknadel', fee: 65 },
];

/**
 * Fonction utilitaire pour récupérer les frais d'une zone par son nom
 */
export function getDeliveryFeeByZone(zoneName: string): number {
  const zone = DELIVERY_ZONES.find(
    (z) => z.name.toLowerCase() === zoneName.toLowerCase() || z.id === zoneName.toLowerCase()
  );
  return zone ? zone.fee : 11; // Valeur par défaut : Agdal (11 DH)
}