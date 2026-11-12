// Pouch pergelangan — mockup bentuk, bukan pola jahit.
// Dimensi dari hardware-build-guide.html §08 lewat params.md.
//
// Sumbu lokal: x = lebar 70, y = tinggi 85, z = tebal 26 (terpusat di 0).
//   z = -13 .. -10 : dinding depan, dengan lubang port USB
//   z = +10 .. +13 : dinding belakang, dengan tiga titik velcro
//   y = +40 .. +42,5 : bibir atas, dibuka selebar rongga
// Isi rongga: 65 x 80 x 20.
//
// EXPORT = true hanya cangkang (untuk STL/cek volume).

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

// isi pouch (mm)
ESP32 = [25.5, 51.5, 11];
TP4056 = [25, 19, 2];
LIPO = [30, 40, 5];
BUZZER = [9.5, 9.5, 6];
PCB = [20, 20, 1.6];

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
    // (lebih tebal dari badan supaya tidak ada muka yang berimpit)
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
  for (x = [-21, 0, 21])
    translate([x, -POUCH_H / 2 + 17, POUCH_D / 2 + 0.2])
      cylinder(r = 10, h = 1.2, $fn = 40);
}

module contents() {
  // Satu lapisan x-y, tidak saling bertumpuk, semuanya di dalam rongga
  // 65 x 80 (x = ±32,5; y = ±40). Menghadap dinding depan yang dibuang pada
  // gambar potong.
  translate([0, 0, -IN_D / 2 + 1.5]) {
    color("Khaki") translate([-10, -21, LIPO[2] / 2])
      cube([LIPO[0], LIPO[1], LIPO[2]], center = true);
    color("OliveDrab") translate([18, -28.5, TP4056[2] / 2])
      cube([TP4056[0], TP4056[1], TP4056[2]], center = true);
    color("SeaGreen") translate([-14, 14, PCB[2] / 2])
      cube([PCB[0], PCB[1], PCB[2]], center = true);
    // ESP32 berdiri: sisi 51,5 mm mengikuti tinggi rongga 80 mm
    color("RoyalBlue") translate([17, 8, ESP32[2] / 2])
      cube([ESP32[0], ESP32[1], ESP32[2]], center = true);
    color("Black") translate([-26, 31, BUZZER[2] / 2])
      cylinder(r = BUZZER[0] / 2, h = BUZZER[2], $fn = 40);
  }
}

// Lapisan dalam rongga: memberi kontras supaya lubang port dan bukaan atas
// terbaca di render. Bukan bagian yang dicetak.
module lining() {
  color([0.80, 0.83, 0.87])
    translate([0, 0, -IN_D / 2 + 0.5])
      cube([IN_W - 0.4, IN_H - 0.4, 1], center = true);
}

// bingkai tipis seukuran rongga, untuk gambar tata letak isi
module cavity_frame() {
  color([0.30, 0.36, 0.44, 0.55])
    translate([0, 0, -IN_D / 2]) linear_extrude(2)
      difference() {
        square([IN_W, IN_H], center = true);
        square([IN_W - 4, IN_H - 4], center = true);
      }
}

module pouch(show_contents = false) {
  color([0.30, 0.36, 0.44]) shell();
  color([0.85, 0.85, 0.85]) velcro();
  if (show_contents) contents(); else lining();
}

// EXPORT = true hanya mengirim cangkang, untuk STL.
EXPORT = false;

if (EXPORT) shell(); else pouch(show_contents = false);
