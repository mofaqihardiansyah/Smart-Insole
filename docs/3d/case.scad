// ============================================================
// case.scad — kotak elektronik cetak 3D untuk smart insole
// ============================================================
// Menggantikan pouch kain di pergelangan kaki. Berisi ESP32, TP4056,
// baterai LiPo, dan (opsional) papan bolong pembagi tegangan.
//
// Satuan mm, Z ke atas. Sumbu: x = lebar, y = tinggi kotak, z = tebal.
//   z = 0            muka luar (menghadap menjauhi kaki, duduk di meja cetak)
//   z = WALL..BODY_D rongga, terbuka ke atas
//   z = BODY_D       bibir (tepi atas dinding), tempat tutup bersandar
//   z = BODY_D+LID_T muka dalam (menghadap kulit)
//
// Bagian: body-kanan, body-kiri (cermin), lid (sama untuk keduanya), test.
// Jalankan lewat ./build-case.sh — jangan ekspor manual, gerbangnya ada di sana.
//
// Sumber angka: docs/3d/params.md (tabel "Kotak cetak 3D").
// ============================================================

PROFILE = "fdm";     // "fdm" | "sla"
PART    = "all";     // "body-kanan" | "body-kiri" | "lid" | "test"
                     // | "denah" | "potong" (proyeksi 2D untuk DXF)
                     // | "detail-congkel" (potongan dekat takik) | "all"
SECTION = "";        // "" | "y" | "x"  → potongan melintang untuk pemeriksaan
EXPORT  = false;     // true = hanya geometri bagian terpilih, tanpa warna

// ------------------------------------------------------------
// Dimensi komponen — HASIL PENGUKURAN, bukan asumsi
// ------------------------------------------------------------
ESP_L = 50;    ESP_W = 27;    ESP_T = 11;    // DevKit + pin header
BAT_L = 40;    BAT_W = 29;    BAT_T = 5.5;   // YCX 503040 + selotip
TP_L  = 20;    TP_W  = 13;    TP_T  = 5;     // TP4056 Type-C
PCB_L = 36;    PCB_W = 26;    PCB_T = 1.6;   // papan bolong, potongan
PCB_H = 6;                                   // tinggi resistor terpasang

assert(ESP_T > 0 && BAT_T > 0 && TP_T > 0,
       "DIMS belum lengkap: ukur tebal komponen sebelum mengekspor STL");
assert(ESP_L == 50 && ESP_W == 27 && BAT_L == 40 && BAT_W == 29,
       "DIMS tidak sesuai pengukuran 2026-11-16 — perbarui params.md dulu");

// ------------------------------------------------------------
// Rongga dan profil cetak
// ------------------------------------------------------------
IN_W = 68;  IN_H = 68;  IN_D = 18;

WALL        = (PROFILE == "sla") ? 2.0 : 2.5;
CLEAR_SLIDE = (PROFILE == "sla") ? 0.15 : 0.30;
CLEAR_PRESS = (PROFILE == "sla") ? 0.05 : 0.15;   // pas-cerat lidah tutup
SCREW_D     = (PROFILE == "sla") ? 4.0 : 2.5;   // M3 langsung vs insert
MIN_WALL    = (PROFILE == "sla") ? 1.2 : 1.6;

OUT_W  = IN_W + 2 * WALL;
OUT_H  = IN_H + 2 * WALL;
BODY_D = WALL + IN_D;          // rongga terbuka ke atas; tutup bersandar di bibir
LID_T  = 3;
TONGUE = 1.5;
TONGUE_CLEAR = CLEAR_PRESS;   // pas-cerat: tutup ditahan gesekan, bukan sekrup
BAND_W = 44;                  // lebar alur band di muka luar
BAND_MAX = 40;                // band elastis terlebar yang dipakai (30-40 mm)
VENT_D = 2.5;                 // diameter lubang ventilasi
R_OUT  = 5;
R_IN   = 4;

SCREW_DEPTH = 12;
BOSS_D      = 7;
PIN_D       = 2.0;   // kalau pin dipasang lagi, lubangnya harus masuk dinding
USE_PINS    = false; // pin pemandu dihapus: lidah cincin sudah memandu sendiri
PIN_H       = 3.5;
PAD_H       = 2.5;      // dudukan ESP32
TP_PAD_H    = 1.5;      // dudukan TP4056
ESP_LIP_H   = 3.5;      // bibir penahan = alas board (PAD_H) + 1
TP_LIP_H    = 2.5;      // bibir penahan = alas board (TP_PAD_H) + 1
GROOVE_D    = 0.8;      // kedalaman alur band; sisa lantai harus >= MIN_WALL
CBORE_D     = 2.0;      // kedalaman reses sekrup di tutup
NOTCH_D     = 6;        // diameter takik congkel
FOAM        = 2;        // busa antara baterai dan papan bolong

// ------------------------------------------------------------
// Tata letak isi (titik tengah rongga di 0,0)
// ------------------------------------------------------------
COL_W = 30;                       // lebar tiap kolom isi
BAT_X0 = -33.5;  BAT_X1 = -4.5;   // 29
BAT_Y0 = -33.5;  BAT_Y1 =  6.5;   // 40
ESP_CX = 19;                      // 5.5 .. 32.5
ESP_Y0 = -17;    ESP_Y1 = 33;     // 50
ESP_CY = (ESP_Y0 + ESP_Y1) / 2;
TP_CX  = 23.5;                    // 13.5 .. 33.5, konektor 0,5 mm dari dinding
TP_Y0  = -33.5;  TP_Y1 = -20.5;   // 13
TP_CY  = (TP_Y0 + TP_Y1) / 2;
PCB_X0 = -31.5;  PCB_X1 = -5.5;   // 26
PCB_Y0 = -31;    PCB_Y1 = 5;      // 36

BOSS_Y  = 27;
PIN_Y   = IN_H / 2 + WALL / 2;    // titik tengah dinding atas/bawah
// Tinggi titik tengah soket: alas board + tebal PCB + setengah tinggi rumah soket
ESP_USB_Z = WALL + PAD_H + 1.6 + 1.5;      // 8,1
TP_USB_Z  = WALL + TP_PAD_H + 1.6 + 1.5;   // 7,1
VENT_Y    = [22, 26, 30];                  // di atas jangkauan band elastis
CABLE_Z = WALL + 3.5;
CURB_W  = 1.5;
CURB_H  = 2;
NOTCH_W = 14;

// Gerbang tata letak: gagal sebelum STL ditulis kalau ada yang tidak muat.
assert(BAT_W <= COL_W,               "baterai lebih lebar dari kolomnya");
assert(ESP_W <= COL_W,               "ESP32 lebih lebar dari kolomnya");
// TP4056 duduk memanjang di sumbu x, jadi yang memakan tinggi kolom adalah lebarnya
assert(ESP_L + 3 + TP_W <= IN_H - 2, "ESP32 + TP4056 tidak muat satu kolom");
assert(IN_W - 2 * COL_W >= BOSS_D,   "koridor sekrup terlalu sempit");
assert(BAT_T + FOAM + PCB_T + PCB_H <= IN_D - TONGUE - 1,
       "tumpukan baterai + papan bolong terlalu tinggi");
assert(PAD_H + ESP_T <= IN_D - TONGUE - 1, "ESP32 terlalu tebal untuk rongga");
assert(WALL >= MIN_WALL,             "dinding lebih tipis dari batas profil cetak");
assert(ESP_LIP_H >= PAD_H + 1,       "bibir ESP32 lebih rendah dari alas board");
assert(TP_LIP_H >= TP_PAD_H + 1,     "bibir TP4056 lebih rendah dari alas board");
assert(WALL - GROOVE_D >= MIN_WALL,  "alur band memotong dinding terlalu tipis");
assert(TP_USB_Z - 3 >= WALL + 0.2,   "soket TP4056 menembus lantai");
assert(VENT_Y[0] - VENT_D / 2 > BAND_MAX / 2,
       "ventilasi tertutup band elastis");
assert(CBORE_D <= LID_T - 1,         "reses sekrup menyisakan pelat terlalu tipis");
// Hanya berlaku kalau pin dipasang kembali (USE_PINS = true).
assert(!USE_PINS || (PIN_Y + (PIN_D + 0.3) / 2 <= OUT_H / 2 &&
                     PIN_Y - (PIN_D + 0.3) / 2 >= IN_H / 2),
       "lubang pin menembus tepi tutup; perbaiki sebelum memasang pin kembali");
// Bos tidak boleh bertabrakan dengan lidah tutup yang turun ke dalam rongga
assert(BOSS_Y + BOSS_D / 2 <= (IN_H - 2 * TONGUE_CLEAR) / 2 - WALL,
       "bos sekrup bertabrakan dengan lidah tutup");

// ------------------------------------------------------------
module rrect(w, h, r) {
  offset(r = r) offset(r = -r) square([w, h], center = true);
}

module shell() {
  difference() {
    translate([0, 0, 0]) linear_extrude(BODY_D) rrect(OUT_W, OUT_H, R_OUT);
    // rongga menembus ke atas: yang tersisa hanya dinding sisi dan lantai
    translate([0, 0, WALL]) linear_extrude(IN_D + 1) rrect(IN_W, IN_H, R_IN);
  }
}

// Bos sekrup: berdiri di lantai, setinggi bibir
module bosses() {
  for (sy = [-1, 1])
    translate([0, sy * BOSS_Y, WALL])
      cylinder(d = BOSS_D, h = IN_D, $fn = 48);
}

// Curb baterai: dua dinding, dua sisi lain memakai dinding rongga
module battery_curb() {
  // dinding atas, dengan takik jari
  translate([0, BAT_Y1 + CURB_W / 2, WALL])
    difference() {
      translate([(BAT_X0 + BAT_X1) / 2, 0, 0])
        linear_extrude(CURB_H)
          square([BAT_X1 - BAT_X0 + 1, CURB_W], center = true);
      translate([-19, 0, -0.1]) linear_extrude(CURB_H + 0.2)
        square([NOTCH_W, CURB_W + 1], center = true);
    }
  // dinding sisi koridor
  translate([BAT_X1 + CURB_W / 2, (BAT_Y0 + BAT_Y1) / 2, WALL])
    linear_extrude(CURB_H)
      square([CURB_W, BAT_Y1 - BAT_Y0 + 1], center = true);
}

// Dudukan ESP32: empat pad sudut + dua bibir sisi
module esp_seat() {
  for (sx = [-1, 1], sy = [-1, 1])
    translate([ESP_CX + sx * (ESP_W / 2 - 2.5),
               ESP_CY + sy * (ESP_L / 2 - 2.5), WALL])
      cylinder(d = 5, h = PAD_H, $fn = 32);
  for (sx = [-1, 1])
    translate([ESP_CX + sx * (ESP_W / 2 + 0.5), ESP_CY, WALL])
      linear_extrude(ESP_LIP_H)
        square([CURB_W, ESP_L * 0.5], center = true);
}

// Dudukan TP4056: empat pad 1,5 mm + dua bibir penahan.
// Bibir harus lebih tinggi dari pad, kalau tidak board meluncur di atasnya.
module tp_seat() {
  for (sx = [-1, 1], sy = [-1, 1])
    translate([TP_CX + sx * (TP_L / 2 - 2.5), TP_CY + sy * (TP_W / 2 - 2.5), WALL])
      cylinder(d = 4, h = TP_PAD_H, $fn = 32);
  for (sy = [-1, 1])
    translate([TP_CX, TP_CY + sy * (TP_W / 2 + 0.5), WALL])
      linear_extrude(TP_LIP_H)
        square([TP_L - 2, CURB_W], center = true);
}

// Satu alur band elastis di muka luar: menahan band 30-40 mm agar tidak
// meluncur naik-turun. Band ini juga yang menekan tutup ke dalam rongga,
// jadi tidak perlu sekrup.
module strap_groove() {
  translate([0, 0, -0.01]) linear_extrude(GROOVE_D + 0.01)
    square([BAND_W, 4], center = true);
}

// Takik congkel: lekukan pada tepi atas dinding, supaya tepi tutup bisa
// diungkit dengan kuku atau uang logam tanpa menggores garis sambungan.
module pry_notch() {
  translate([-19, -OUT_H / 2 - WALL / 2, BODY_D]) rotate([-90, 0, 0])
    cylinder(d = NOTCH_D, h = WALL + 2, $fn = 32);
}

// Titik penanda pada muka luar: 1 titik = kanan, 2 titik = kiri.
// Sengaja titik, bukan huruf, supaya tidak bergantung pada font di mesin lain.
module label_dots(kiri) {
  translate([-26, 0, -0.01]) cylinder(d = 3, h = 0.6 + 0.01, $fn = 24);
  if (kiri) translate([-26, 9, -0.01]) cylinder(d = 3, h = 0.6 + 0.01, $fn = 24);
}

module wall_slots() {
  // slot USB ESP32, dinding atas
  translate([ESP_CX, OUT_H / 2, ESP_USB_Z])
    cube([12, WALL * 2 + 2, 6], center = true);
  // slot USB TP4056, dinding samping, sejajar konektor di modulnya
  translate([OUT_W / 2, TP_CY, TP_USB_Z])
    cube([WALL * 2 + 2, 10, 6], center = true);
  // masuk kabel enam inti, dinding bawah
  translate([0, -OUT_H / 2, CABLE_Z])
    cube([5, WALL * 2 + 2, 4], center = true);
  // ventilasi, di atas jangkauan band elastis
  for (y = VENT_Y)
    translate([OUT_W / 2 - WALL - 1, y, TP_USB_Z])
      rotate([0, 90, 0]) cylinder(d = VENT_D, h = WALL * 2 + 2, $fn = 24);
}

module screw_holes() {
  for (sy = [-1, 1])
    translate([0, sy * BOSS_Y, BODY_D - SCREW_DEPTH])
      cylinder(d = SCREW_D, h = SCREW_DEPTH + 1, $fn = 32);
}

module body(kiri = false) {
  difference() {
    union() {
      shell();
      bosses();
      battery_curb();
      esp_seat();
      tp_seat();
    }
    screw_holes();
    wall_slots();
    strap_groove();
    pry_notch();
    label_dots(kiri);
  }
}

module lid() {
  difference() {
    union() {
      translate([0, 0, BODY_D]) linear_extrude(LID_T) rrect(OUT_W, OUT_H, R_OUT);
      translate([0, 0, BODY_D - TONGUE]) linear_extrude(TONGUE + 0.01)
        difference() {
          rrect(IN_W - 2 * TONGUE_CLEAR, IN_H - 2 * TONGUE_CLEAR, R_IN);
          rrect(IN_W - 2 * TONGUE_CLEAR - 2 * WALL, IN_H - 2 * TONGUE_CLEAR - 2 * WALL,
                max(R_IN - WALL, 0.5));
        }
    }
    for (sy = [-1, 1]) {
      translate([0, sy * BOSS_Y, BODY_D - 0.05])
        cylinder(d = 3.2, h = LID_T + 0.1, $fn = 32);
      translate([0, sy * BOSS_Y, BODY_D + LID_T - CBORE_D])
        cylinder(d = 6, h = CBORE_D + 0.1, $fn = 32);
    }
    // relung busa sisi kulit
    translate([0, 0, BODY_D + LID_T - 1]) linear_extrude(1.05)
      rrect(IN_W - 4, IN_H - 4, R_IN);
  }
}

// Kupon uji coba: satu bos sekrup, satu curb baterai, satu dinding
// berisi slot USB-C. Cetak ini dulu sebelum kotak penuh, untuk
// memastikan jarak main baterai dan lubang sekrup cocok.
// Gerbang: tidak ada fitur yang boleh keluar dari pelat 60 x 40.
module test_coupon() {
  PLATE_W = 60;
  PLATE_H = 40;
  WALL_X  = PLATE_W / 2 - WALL / 2;
  difference() {
    union() {
      linear_extrude(5) square([PLATE_W, PLATE_H], center = true);
      // dinding uji di tepi kanan
      translate([WALL_X, 0, 5]) linear_extrude(10)
        square([WALL, 30], center = true);
      translate([-18, -8, 5]) cylinder(d = BOSS_D, h = 12, $fn = 48);
      translate([-3.5, 0, 5]) linear_extrude(CURB_H)
        square([CURB_W, 38], center = true);
      translate([2, 0, 5]) linear_extrude(CURB_H)
        square([BAT_X1 - BAT_X0 + 1, CURB_W], center = true);
    }
    // slot USB-C menembus dinding uji
    translate([WALL_X, 0, 9]) cube([WALL + 2, 10, 6], center = true);
    translate([-18, -8, -0.01]) cylinder(d = SCREW_D, h = 18, $fn = 32);
  }
}

assert(38 / 2 <= 40 / 2, "curb kupon keluar dari pelat");
assert(-18 - BOSS_D / 2 >= -60 / 2 && -18 + BOSS_D / 2 <= 60 / 2 &&
       -8 - BOSS_D / 2 >= -40 / 2 && -8 + BOSS_D / 2 <= 40 / 2,
       "bos kupon keluar dari pelat");

// Setiap bagian diekspor sudah berorientasi siap cetak: bidang terendah di z = 0.
module selected() {
  if (PART == "body-kanan") body(false);
  else if (PART == "body-kiri") mirror([1, 0, 0]) body(true);
  else if (PART == "lid") translate([0, 0, -(BODY_D - TONGUE)]) lid();
  else if (PART == "test") test_coupon();
  // Potongan dekat takik congkel, untuk pemeriksaan mata
  else if (PART == "detail-congkel")
    intersection() {
      body(false);
      // potongan dinding -y di sekitar takik, sengaja berhenti sebelum bos
      translate([-21, -33, 16.5]) cube([26, 14, 9], center = true);
    }
  // Proyeksi 2D untuk gambar kerja DXF yang dikirim bersama STL
  else if (PART == "denah") projection(cut = false) body(false);
  else if (PART == "potong") projection(cut = false) rotate([90, 0, 0]) body(false);
  else body(false);
}

module cross_section() {
  if (SECTION == "y") translate([100, 0, 0]) cube([200, 400, 200], center = true);
  if (SECTION == "x") translate([0, 100, 0]) cube([400, 200, 200], center = true);
}

module scene() {
  difference() {
    selected();
    cross_section();
  }
}

if (EXPORT) {
  scene();
} else {
  color([0.32, 0.38, 0.46]) scene();
}
