// Tata letak isi pouch tanpa cangkang: bingkai rongga 65 x 80 + lantai.
// Dipakai oleh build-3d.sh untuk gambar "isi pouch".
//
// Isi berasal dari contents.json lewat gen/pouch-contents.scad; jangan
// menyalin dimensi komponen ke sini.

use <pouch.scad>
include <figure-kit.scad>

cavity_frame();
contents();
markers(CALLOUTS);
