export function handleTap(dirtSpot) {
  const wasClean = dirtSpot.isClean();
  dirtSpot.registerTap();

  return { becameClean: !wasClean && dirtSpot.isClean() };
}
