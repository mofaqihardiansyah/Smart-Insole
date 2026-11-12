// Insole smart insole — alas EVA 5 mm, pocket sensor, channel kabel, cover 2 mm.
// Outline, jalur channel, dan angka dasar berasal dari gen/insole-data.scad,
// yang dibuat oleh build-cad.py dari sumber angka yang sama dengan gambar kerja
// (params.md). Jangan menyalin angka itu ke berkas ini.
//
// Ubah angka di sini lalu jalankan: ./docs/3d/build-3d.sh
// Satuan: mm. x = 0 di tumit, +y = sisi lateral (luar).

include <gen/insole-data.scad>

// Angka khusus model 3D (tidak dipakai gambar kerja 2D)
POCKET_D = 2;        // kedalaman cerukan sensor
SENSOR_T = 0.5;      // tebal film FSR
RELIEF = 1.5;        // relief channel di bawah cover: 1,5 + 1,5 = 3,0 untuk bundel Ø 3,0
CABLE_R = 1.5;       // radius bundel 6 inti AWG 30
FN = 24;

module outline2d() {
  polygon(OUTLINE);
}

module pocket2d() {
  for (s = SENSORS) translate([s[1], 0]) square([POCKET, POCKET], center = true);
}

module channel2d(w) {
  for (p = CHANNEL_PATHS)
    for (i = [0 : len(p) - 2])
      hull() {
        translate(p[i]) circle(w / 2);
        translate(p[i + 1]) circle(w / 2);
      }
}

module base() {
  difference() {
    linear_extrude(BASE_T) outline2d();
    translate([0, 0, BASE_T - POCKET_D]) linear_extrude(POCKET_D + 1) pocket2d();
    translate([0, 0, BASE_T - CH_D]) linear_extrude(CH_D + 1) channel2d(CH_W);
  }
}

module cover(lift = 0) {
  difference() {
    translate([0, 0, BASE_T + lift]) linear_extrude(COVER_T) outline2d();
    translate([0, 0, BASE_T + lift]) linear_extrude(RELIEF + 0.01) channel2d(CH_W);
  }
}

module fabric(lift = 0) {
  translate([0, 0, BASE_T + COVER_T + lift]) linear_extrude(FABRIC_T) outline2d();
}

module sensors() {
  for (s = SENSORS)
    translate([s[1], 0, BASE_T - POCKET_D])
      cylinder(r = SENSOR_R, h = SENSOR_T, $fn = 48);
}

module cable() {
  z = BASE_T - CH_D + CABLE_R;
  for (p = CHANNEL_PATHS)
    for (i = [0 : len(p) - 2])
      hull() {
        translate([p[i][0], p[i][1], z]) sphere(CABLE_R, $fn = FN);
        translate([p[i + 1][0], p[i + 1][1], z]) sphere(CABLE_R, $fn = FN);
      }
}

module insole(lift = 0, show_cover = true, show_fabric = false, ghost = false) {
  color("Gainsboro") base();
  color("SteelBlue") sensors();
  color("DimGray") cable();
  if (show_cover) color(ghost ? [0.93, 0.93, 0.90, 0.22] : [0.93, 0.93, 0.90]) cover(lift);
  if (show_fabric) color(ghost ? [0.55, 0.75, 0.88, 0.20] : [0.55, 0.75, 0.88]) fabric(lift + 12);
}

// LIFT  = 0 tampak terakit; LIFT > 0 = gambar ledak (cover diangkat).
// GHOST = true membuat cover dan kain tembus pandang, sensor dan kabel terlihat.
// EXPORT = true hanya mengirim alas + cover, untuk STL.
LIFT = 0;
GHOST = false;
EXPORT = false;

if (EXPORT) union() { base(); cover(); } else insole(LIFT, true, LIFT > 0, GHOST);
