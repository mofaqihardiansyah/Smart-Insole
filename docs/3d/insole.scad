// Insole smart insole — alas EVA 5 mm, pocket sensor, channel kabel, cover 2 mm.
//
// Profil tapak, jalur channel, dan angka dasar berasal dari
// gen/insole-data.scad, yang dibuat build-cad.py dari angka yang sama dengan
// gambar kerja 2D (params.md). Jangan menyalin angka itu ke berkas ini.
// Warna material berasal dari legend.json lewat gen/palette.scad.
//
// Ubah angka di sini lalu jalankan: ./docs/3d/build-3d.sh
// Satuan: mm. x = 0 di tumit, naik ke ujung jari; +y = sisi lateral (luar).
//
// Variabel yang bisa di-override dari baris perintah:
//   LIFT     > 0  tampak ledak (cover dan kain diangkat)
//   GHOST    true cover tembus pandang, sensor dan kabel terlihat
//   DETAIL   true potongan detail midfoot (x 95..165), cover dibuka
//   NOCABLE  true sembunyikan bundel kabel (tampak atas berskala)
//   EXPORT   true hanya alas + cover, untuk STL (tanpa penanda)

include <gen/insole-data.scad>
include <figure-kit.scad>

// Angka khusus model 3D (tidak dipakai gambar kerja 2D)
POCKET_D = 2;          // kedalaman cerukan sensor
SENSOR_T = 0.5;        // tebal film FSR
RELIEF = 1.5;          // relief channel di bawah cover: 1,5 + 1,5 = 3,0 mm
CABLE_R = 1.6;         // radius bundel 6 inti AWG 30
TAIL_W = 5;            // lebar ekor FSR
FABRIC_LIFT = 12;      // jarak kain di atas cover pada tampak ledak
SLIDE_DY = 0;          // geser lapisan ke samping pada tampak ledak
GHOST_A = 0.30;        // kepekatan cover tembus pandang
DETAIL_BOX = [95, -60, -4, 70, 120, 18];   // x, y, z, dx, dy, dz
FN = 28;

LIFT = 0;
GHOST = false;
NOCOVER = false;
DETAIL = false;
NOCABLE = false;
EXPORT = false;

module outline2d() {
  // Satu kurva tertutup hasil penghalusan spline di build-cad.py: tidak ada
  // lagi lekukan di titik potong lingkaran, jadi dinding samping mulus.
  polygon(OUTLINE);
}

module pocket2d() {
  for (s = SENSORS) translate([s[1], 0]) square([POCKET, POCKET], center = true);
}

module ribbon(paths, w) {
  // Satu poligon hasil offset, bukan rantai hull(): hull per segmen
  // meninggalkan bidang dalam yang bertumpuk, dan di preview OpenSCAD
  // bidang itu muncul sebagai garis-garis z-fighting di dasar channel.
  offset(r = w / 2, $fn = FN)
    for (p = paths) polygon(p);
}

module base() {
  difference() {
    linear_extrude(BASE_T) outline2d();
    translate([0, 0, BASE_T - POCKET_D]) linear_extrude(POCKET_D + 1) pocket2d();
    translate([0, 0, BASE_T - CH_D]) linear_extrude(CH_D + 1)
      ribbon(CHANNEL_PATHS, CH_W);
  }
}

// Cover mulai 0,02 mm di atas alas: dua bidang yang berimpit (permukaan atas
// alas dan permukaan bawah cover) saling berebut kedalaman, dan pada cover
// tembus pandang itu muncul sebagai garis putus-putus di tepi siluet.
COVER_GAP = 0.02;

module cover(lift = 0, dy = 0) {
  translate([0, dy, 0]) difference() {
    translate([0, 0, BASE_T + lift + COVER_GAP]) linear_extrude(COVER_T) outline2d();
    translate([0, 0, BASE_T + lift + COVER_GAP]) linear_extrude(RELIEF + 0.02)
      ribbon(CHANNEL_PATHS, CH_W);
  }
}

module fabric(lift = 0, dy = 0) {
  translate([0, dy, BASE_T + COVER_T + lift]) linear_extrude(FABRIC_T)
    outline2d();
}

// Bidang bawah sensor dan ekor dinaikkan 0,05 mm dari dasar pocket. Kalau
// tepat menempel, dua bidang yang berimpit (dasar pocket dan bidang bawah
// film) saling berebut kedalaman dan muncul sebagai garis-garis abu-abu.
FILM_Z = BASE_T - POCKET_D + 0.05;

module sensors() {
  color(mat("sensor"))
    for (s = SENSORS)
      translate([s[1], 0, FILM_Z])
        cylinder(r = SENSOR_R, h = SENSOR_T, $fn = 64);
}

// Ekor FSR: jalur tipis dari tiap sensor ke channel, seperti kenyataan.
module tails() {
  color(mat("sensor"))
    for (i = [0 : len(SENSORS) - 1])
      translate([0, 0, FILM_Z])
        linear_extrude(SENSOR_T) ribbon([CHANNEL_PATHS[i + 1]], TAIL_W);
}

module cable() {
  z = BASE_T - CH_D + CABLE_R;
  color(mat("cable"))
    for (p = CHANNEL_PATHS)
      for (i = [0 : len(p) - 2])
        hull() {
          translate([p[i][0], p[i][1], z]) sphere(CABLE_R, $fn = FN);
          translate([p[i + 1][0], p[i + 1][1], z]) sphere(CABLE_R, $fn = FN);
        }
}

// Kotak potongan untuk tampak DETAIL. Dideklarasikan di level atas karena
// OpenSCAD tidak mengizinkan deklarasi module di dalam blok if.
module detail_box() {
  translate([DETAIL_BOX[0], DETAIL_BOX[1], DETAIL_BOX[2]])
    cube([DETAIL_BOX[3], DETAIL_BOX[4], DETAIL_BOX[5]]);
}

module insole(lift = 0, show_cover = true, show_fabric = false, ghost = false) {
  color(mat("base")) base();
  sensors();
  tails();
  if (!NOCABLE) cable();
  // Pada tampak ledak lapisan digeser ke samping juga: kalau hanya diangkat,
  // lapisan di atasnya selalu menutupi tepi lapisan di bawahnya.
  spread = lift > 0 ? SLIDE_DY : 0;
  if (show_cover) {
    c = mat("cover");
    color(ghost ? [c[0], c[1], c[2], GHOST_A] : c) cover(lift, spread);
  }
  if (show_fabric) {
    f = mat("fabric");
    color(ghost ? [f[0], f[1], f[2], GHOST_A + 0.10] : f)
      fabric(lift + FABRIC_LIFT, 2 * spread);
  }
}

if (EXPORT) {
  union() {
    base();
    cover();
  }
} else if (DETAIL) {
  // Detail midfoot. color() HARUS di luar intersection(): bila di dalam,
  // OpenSCAD mewarnai permukaan potongan dengan warna "back" colorscheme
  // (biru pada tema Tomorrow), bukan dengan warna material.
  // Urutan penting: di preview, bidang potongan memakai warna blok
  // intersection() terakhir. Alas digambar terakhir supaya dinding
  // potongannya berwarna alas, bukan warna sensor.
  color(mat("sensor")) intersection() {
    union() {
      sensors();
      tails();
    }
    detail_box();
  }
  color(mat("base")) intersection() {
    base();
    detail_box();
  }
  if (!NOCABLE) color(mat("cable")) intersection() {
    cable();
    detail_box();
  }
  markers(CALLOUTS);
} else {
  insole(LIFT, !NOCOVER, LIFT > 0, GHOST);
  markers(CALLOUTS);
}
