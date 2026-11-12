// Pouch pergelangan — mockup bentuk, bukan pola jahit.
// Dimensi dari hardware-build-guide.html §08 lewat params.md.
// Warna material dari legend.json; tata letak isi dari contents.json
// (gen/pouch-contents.scad, dibuat annotate.py).
//
// Sumbu lokal: x = lebar 70, y = tinggi 85, z = tebal 26 (terpusat di 0).
//   z = -13 .. -10 : dinding depan, dengan lubang port USB
//   z = +10 .. +13 : dinding belakang, dengan tiga titik velcro
//   y = +40 .. +42,5 : bibir atas, dibuka selebar rongga
// Rongga isi: 65 x 80 x 20.
//
// EXPORT = true hanya cangkang (untuk STL/cek volume).

include <figure-kit.scad>
include <gen/pouch-contents.scad>

POUCH_W = 70;      // lebar luar
POUCH_H = 85;      // tinggi luar
POUCH_D = 26;      // tebal luar
IN_W = 65;         // rongga
IN_H = 80;
IN_D = 20;
WALL_X = (POUCH_W - IN_W) / 2;   // 2,5
WALL_Y = (POUCH_H - IN_H) / 2;   // 2,5
WALL_Z = (POUCH_D - IN_D) / 2;   // 3
PORT_W = 12;       // lubang port USB
PORT_H = 8;
PORT_Y = 11.5;     // pusat lubang dari tengah pouch (sama dengan gambar 2D)
R = 5;             // radius sudut

module box2d(w, h, r) {
  offset(r = r) offset(r = -r) square([w, h], center = true);
}

module shell() {
  difference() {
    translate([0, 0, -POUCH_D / 2]) linear_extrude(POUCH_D)
      box2d(POUCH_W, POUCH_H, R);
    translate([0, 0, -IN_D / 2]) linear_extrude(IN_D)
      box2d(IN_W, IN_H, max(R - 0.5, 0));
    // bukaan atas selebar rongga, tembus seluruh tebal
    translate([0, POUCH_H / 2, 0])
      cube([IN_W, 6, POUCH_D + 2], center = true);
    // lubang port USB menembus dinding depan
    translate([0, PORT_Y, -POUCH_D / 2 - 1])
      linear_extrude(WALL_Z + 2)
        offset(r = 2) square([PORT_W - 4, PORT_H - 4], center = true);
  }
}

// velcro di dinding belakang, tiga titik di bagian bawah
module velcro() {
  color(mat("velcro"))
    for (x = [-21, 0, 21])
      translate([x, -POUCH_H / 2 + 17, POUCH_D / 2 + 0.2])
        cylinder(r = 10, h = 1.2, $fn = 48);
}

// Isi pouch dari contents.json: satu lapisan, tidak bertumpuk.
module contents() {
  translate([0, 0, -IN_D / 2])
    for (p = PARTS) {
      color(mat(p[0])) translate(p[2])
        if (p[3] == "cyl") cylinder(d = p[1][0], h = p[1][2], $fn = 48, center = true);
        else cube(p[1], center = true);
    }
}

// Lantai rongga: penanda batas bawah, bukan bagian yang dicetak.
module lining() {
  color([0.82, 0.85, 0.88])
    translate([0, 0, -IN_D / 2 + 0.5])
      cube([IN_W - 0.4, IN_H - 0.4, 1], center = true);
}

// Bingkai tipis seukuran rongga + lantai, untuk gambar tata letak isi.
module cavity_frame() {
  color([0.30, 0.36, 0.44, 0.55])
    translate([0, 0, -IN_D / 2]) linear_extrude(2)
      difference() {
        square([IN_W, IN_H], center = true);
        square([IN_W - 4, IN_H - 4], center = true);
      }
  color([0.94, 0.95, 0.96])
    translate([0, 0, -IN_D / 2 - 0.6])
      cube([IN_W, IN_H, 0.6], center = true);
}

module pouch(show_contents = false) {
  color(mat("shell")) shell();
  velcro();
  if (show_contents) contents(); else lining();
}

// EXPORT = true hanya mengirim cangkang, untuk STL.
EXPORT = false;

if (EXPORT) {
  shell();
} else {
  pouch(show_contents = false);
  markers(CALLOUTS);
}
