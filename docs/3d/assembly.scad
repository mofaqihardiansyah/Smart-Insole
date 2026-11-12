// Posisi pakai: insole di sepatu, harness keluar dari tumit, pouch di
// pergelangan. Bukan model anatomis: silinder abu-abu hanya penanda posisi.
//
// Warna material dari legend.json; geometri insole dan pouch dari model
// masing-masing supaya tidak ada angka yang disalin.

use <insole.scad>
use <pouch.scad>
include <figure-kit.scad>

ANKLE_R = 35;            // radius referensi pergelangan (bukan ukuran anatomis)
ANKLE_X = 45;            // sumbu pergelangan, di atas tumit insole
ANKLE_Z = 8;             // alas silinder = permukaan insole
ANKLE_H = 190;           // tinggi silinder penanda
POUCH_AT = [45, 48, 130];   // pusat pouch, di sisi lateral pergelangan
BAND_H = 20;             // tinggi strap pergelangan
CABLE_R = 1.6;           // radius bundel 6 inti AWG 30

module ankle() {
  a = mat("ankle");
  color([a[0], a[1], a[2], 0.20])
    translate([ANKLE_X, 0, ANKLE_Z]) cylinder(r = ANKLE_R, h = ANKLE_H, $fn = 96);
}

module ankle_band() {
  // strap pergelangan yang menahan pouch
  color(mat("strap")) translate([ANKLE_X, 0, POUCH_AT[2] - BAND_H / 2])
    difference() {
      cylinder(r = ANKLE_R + 2.5, h = BAND_H, $fn = 96);
      translate([0, 0, -1]) cylinder(r = ANKLE_R, h = BAND_H + 2, $fn = 96);
    }
}

// Jalur kabel: keluar dari tumit insole, menyusuri sisi medial, naik ke dasar
// pouch, lalu masuk lewat strain relief.
module harness() {
  path = [
    [30, -14, 4], [18, -30, 14], [10, -22, 52],
    [12, 2, 74], [24, 26, 84], [38, 34, 88], [44, 38, 92],
  ];
  color(mat("harness"))
    for (i = [0 : len(path) - 2])
      hull() {
        translate(path[i]) sphere(CABLE_R, $fn = 24);
        translate(path[i + 1]) sphere(CABLE_R, $fn = 24);
      }
  // strain relief di pintu masuk pouch
  color(mat("harness"))
    translate([45, 39, 95]) cylinder(r = 3, h = 12, $fn = 32);
}

module assembly() {
  ankle();
  insole(0, true, false);
  ankle_band();
  harness();
  // pouch diputar 90° supaya dinding belakang menempel ke strap
  translate(POUCH_AT) rotate([90, 0, 0]) pouch(show_contents = false);
}

assembly();
markers(CALLOUTS);
