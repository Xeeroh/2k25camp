export interface Church {
  sector: number | string;
  name: string;
  district: string;
  pastor?: string;
}

export const CHURCHES_DATA: Church[] = [
  // Distrito Tijuana
  { sector: 1, name: "Antioquia la hermosa", district: "Distrito Tijuana", pastor: "Alvaro García Almazan" },
  { sector: 1, name: "Cristo Centro de la Familia", district: "Distrito Tijuana", pastor: "Alfredo Felix" },
  { sector: 1, name: "Iglesia Fuente Inagotable", district: "Distrito Tijuana", pastor: "Hilario Montoya" },
  { sector: 1, name: "Iglesia San Angel", district: "Distrito Tijuana", pastor: "Juan Montoya" },
  { sector: 1, name: "Luz y Salvación", district: "Distrito Tijuana", pastor: "Eduardo Bohorquez" },
  { sector: 1, name: "Misión Betsaida", district: "Distrito Tijuana", pastor: "Miguel Gallegos" },
  { sector: 1, name: "Misión Libertad", district: "Distrito Tijuana", pastor: "Jorge Molina" },
  { sector: 1, name: "Principe de Paz", district: "Distrito Tijuana", pastor: "Cesar Vargas Herrera" },
  { sector: 1, name: "Remanente de Vida", district: "Distrito Tijuana", pastor: "Alvaro García Balderas" },
  { sector: 1, name: "Silo Comunidad Cristiana", district: "Distrito Tijuana", pastor: "Samuel Castro Cázares" },
  { sector: 1, name: "Tabernaculo de Adoración Familiar", district: "Distrito Tijuana", pastor: "David Guillins" },

  { sector: 2, name: "Centro Familiar Nuevo Amanecer", district: "Distrito Tijuana", pastor: "Roberto de Paz" },
  { sector: 2, name: "Comunidad Apostólica", district: "Distrito Tijuana", pastor: "Manuel Muñoz" },
  { sector: 2, name: "El Manantial", district: "Distrito Tijuana", pastor: "Joel Peralta Acevedo" },
  { sector: 2, name: "El Refugio", district: "Distrito Tijuana", pastor: "Javier Murillo" },
  { sector: 2, name: "Fuente de Misericordia", district: "Distrito Tijuana", pastor: "Gerardo Gutierrez" },
  { sector: 2, name: "León de Judá", district: "Distrito Tijuana", pastor: "Eduardo Reyes Soto" },
  { sector: 2, name: "Maranatha", district: "Distrito Tijuana", pastor: "Enrique Huerta" },
  { sector: 2, name: "Monte Sion Tijuana", district: "Distrito Tijuana", pastor: "Carlos Caravantes Romero" },
  { sector: 2, name: "Nueva Esperanza Tijuana", district: "Distrito Tijuana", pastor: "Joel Cruz Rivera" },
  { sector: 2, name: "Tabernaculo de Fe Tijuana", district: "Distrito Tijuana", pastor: "Steve Valverde" },

  { sector: 3, name: "Adulam", district: "Distrito Tijuana", pastor: "Filiberto Garcia Orpineda" },
  { sector: 3, name: "Betesda", district: "Distrito Tijuana", pastor: "Tirso Figueroa" },
  { sector: 3, name: "Jesucristo Camino de Salvación", district: "Distrito Tijuana", pastor: "Felipe Angeles" },
  { sector: 3, name: "La paz de Cristo", district: "Distrito Tijuana", pastor: "Humberto Flores" },
  { sector: 3, name: "Lo mejor del trigo", district: "Distrito Tijuana", pastor: "Abraham Aragon Delgado" },
  { sector: 3, name: "Nueva Vida Camalú", district: "Distrito Tijuana", pastor: "Jose Luis Hernandez Trujillo" },

  { sector: 4, name: "Casa de Gracia", district: "Distrito Tijuana", pastor: "Carlos Aguilar" },
  { sector: 4, name: "Castillo del Rey", district: "Distrito Tijuana", pastor: "Isaac Espinoza" },
  { sector: 4, name: "Eben-Ezer", district: "Distrito Tijuana", pastor: "Edgar Serratos" },
  { sector: 4, name: "Familias con Propósito", district: "Distrito Tijuana", pastor: "Carlos Caravantes Soto" },
  { sector: 4, name: "Iglesia Visión", district: "Distrito Tijuana", pastor: "Juan Tinoco Torres" },
  { sector: 4, name: "La Vid Verdadera", district: "Distrito Tijuana", pastor: "Abraham Ramos" },
  { sector: 4, name: "Misión Bethel", district: "Distrito Tijuana", pastor: "Jorge Ortega" },
  { sector: 4, name: "Templo Jerusalem", district: "Distrito Tijuana", pastor: "Emmanuel Medina Cordoba" },
  { sector: 4, name: "Tierra de Promesas", district: "Distrito Tijuana", pastor: "Elias Mestas" },
  
  { sector: "Foráneo", name: "Sin Iglesia Sectoral", district: "Distrito Tijuana" },

  // Otros distritos (sin iglesias específicas)
  { sector: "Foráneo", name: "Distrito Norte", district: "Distrito Norte" },
  { sector: "Foráneo", name: "Distrito Noroeste", district: "Distrito Noroeste" },
  { sector: "Foráneo", name: "Distrito Pacífico Norte", district: "Distrito Pacífico Norte" },
  { sector: "Foráneo", name: "Distrito Baja California Sur", district: "Distrito Baja California Sur" }
];