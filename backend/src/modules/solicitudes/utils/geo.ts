export function calcularDistanciaKm(
  latitudOrigen: string | number | null,
  longitudOrigen: string | number | null,
  latitudDestino: string | number | null,
  longitudDestino: string | number | null,
) {
  const lat1 = Number(latitudOrigen);
  const lon1 = Number(longitudOrigen);
  const lat2 = Number(latitudDestino);
  const lon2 = Number(longitudDestino);
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null;

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(deltaLon / 2) ** 2;
  return Number((6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
}
