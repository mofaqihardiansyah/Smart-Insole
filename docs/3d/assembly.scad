// Posisi pakai: insole di sepatu, harness keluar dari tumit, pouch di pergelangan.
// Bukan model anatomis: silinder abu-abu hanya penanda posisi pergelangan kaki.
use <insole.scad>
use <pouch.scad>

ANKLE_R = 35;          // radius referensi pergelangan (bukan ukuran anatomis)
ANKLE_X = 45;          // sumbu pergelangan, di atas tumit insole
ANKLE_Z = 8;           // alas silinder = permukaan insole
POUCH_AT = [45, 48, 130];   // pusat pouch, di sisi lateral pergelangan
BAND_H = 20;           // tinggi strap pergelangan
CABLE_R = 1.6;         // radius bundel 6 inti AWG 30

module ankle() {
  color([0.62, 0.62, 0.62, 0.22]) translate([ANKLE_X, 0, ANKLE_Z])
    cylinder(r = ANKLE_R, h = 160, $fn = 64);
}

module ankle_band() {
  // strap pergelangan yang menahan pouch
  color([0.32, 0.35, 0.40]) translate([ANKLE_X, 0, POUCH_AT[2] - BAND_H / 2])
    difference() {
      cylinder(r = ANKLE_R + 2.5, h = BAND_H, $fn = 64);
      translate([0, 0, -1]) cylinder(r = ANKLE_R, h = BAND_H + 2, $fn = 64);
    }
}

module harness() {
  path = [
    [20, -20, 3], [6, -30, 12], [2, -18, 50],
    [10, 6, 80], [26, 30, 95], [42, 45, 100],
  ];
  color("DimGray")
    for (i = [0 : len(path) - 2])
      hull() {
        translate(path[i]) sphere(CABLE_R, $fn = 20);
        translate(path[i + 1]) sphere(CABLE_R, $fn = 20);
      }
  // strain relief di pintu masuk pouch
  color("DimGray") translate([42, 45, 92]) cylinder(r = 3, h = 10, $fn = 24);
}

module assembly() {
  ankle();
  insole(0, true, false);
  ankle_band();
  harness();
  translate(POUCH_AT) rotate([90, 0, 0]) pouch(show_contents = false);
}

assembly();
