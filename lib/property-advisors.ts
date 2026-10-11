import { AGENCIES, type Property } from './tucasa';

export function hasPropertyAdvisor(property: Property) {
  return property.confirmed && AGENCIES.some(agency => agency.id === property.source);
}

// Original portraits and illustrative contact details for the academic catalog.
// Numbers deliberately use a non-routable prefix; email uses the reserved .example domain.
const ADVISORS = [
  { name: 'Valeria Rojas', role: 'Asesora inmobiliaria', email: 'valeria.rojas@tucasa.example', presentation: 'Hola, soy Valeria. Te ayudo a comparar opciones y encontrar un espacio que se ajuste a lo que necesitas.' },
  { name: 'Diego Molina', role: 'Asesor inmobiliario', email: 'diego.molina@tucasa.example', presentation: 'Soy Diego. Podemos revisar la distribución, las características y las condiciones de esta propiedad juntos.' },
  { name: 'Andrea Salazar', role: 'Asesora inmobiliaria', email: 'andrea.salazar@tucasa.example', presentation: 'Hola, soy Andrea. Cuéntame qué buscas y te acompaño a evaluar esta propiedad con calma.' },
  { name: 'Mauricio Vargas', role: 'Asesor inmobiliario', email: 'mauricio.vargas@tucasa.example', presentation: 'Soy Mauricio. Estoy aquí para ayudarte a conocer los detalles del inmueble y preparar tus preguntas para una visita.' },
  { name: 'Daniela Rivera', role: 'Asesora inmobiliaria', email: 'daniela.rivera@tucasa.example', presentation: 'Hola, soy Daniela. Revisemos si la ubicación y los espacios de esta propiedad encajan con lo que necesitas.' },
  { name: 'Leonardo Suárez', role: 'Asesor inmobiliario', email: 'leonardo.suarez@tucasa.example', presentation: 'Soy Leonardo. Te ayudo a revisar las características y aclarar las condiciones antes de elegir una propiedad.' },
];

export function advisorForProperty(property: Property) {
  const agencyIndex = AGENCIES.findIndex(agency => agency.id === property.source);
  const externalIndex = { marketplace: 2, deber: 3, links: 5 }[property.source as 'marketplace' | 'deber' | 'links'];
  const index = agencyIndex >= 0 ? agencyIndex : externalIndex ?? 0;
  return {
    ...ADVISORS[index],
    role: agencyIndex >= 0 ? ADVISORS[index].role : 'Contacto de la publicación',
    presentation: agencyIndex >= 0 ? ADVISORS[index].presentation : 'Hola, puedes preparar aquí tu consulta sobre este anuncio. Incluye tus preguntas sobre la ubicación, los espacios y las condiciones de la propiedad.',
    photo: `/advisors/advisor-${index + 1}.webp`,
    phone: `+591 0000 000${index + 1}`,
    maskedPhone: `+591 •••• 000${index + 1}`,
  };
}
