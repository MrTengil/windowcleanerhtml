export function formatFloorLabel(currentFloor, totalFloors) {
  if (totalFloors == null) {
    return `Floor ${currentFloor}`;
  }

  return `Floor ${currentFloor}/${totalFloors}`;
}
