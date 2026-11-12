// Tata letak isi pouch, tanpa cangkang. Bingkai 65 x 80 = dinding rongga.
// Dipakai oleh build-3d.sh: openscad -o render/pouch-contents.png pouch-contents.scad
use <pouch.scad>

cavity_frame();
contents();
