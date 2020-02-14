// string to be preloaded
var preload = '<math xmlns="http://www.w3.org/1998/Math/MathML"><apply type="bool"><deftrue></deftrue><ci type="bool">std</ci><apply type="bool"><and></and><apply type="bool"><deftrue></deftrue><ci type="bool">foundation</ci><apply type="bool"><and></and><apply type="bool"><deftrue></deftrue><ci type="bool">plusAssociate</ci><apply type="bool"><forall></forall><bvar><ci type="num">a___</ci></bvar><bvar><ci type="num">x___</ci></bvar><bvar><ci type="num">b___</ci></bvar><apply type="bool"><eq></eq><apply type="num"><plus></plus><ci type="num">a</ci><apply type="num"><plus></plus><ci type="num">x</ci></apply><ci type="num">b</ci></apply><apply type="num"><plus></plus><ci type="num">a</ci><ci type="num">x</ci><ci type="num">b</ci></apply></apply></apply><ci type="bool">true</ci></apply><apply type="bool"><deftrue></deftrue><ci type="bool">timesAssociate</ci><apply type="bool"><forall></forall><bvar><ci type="num">a___</ci></bvar><bvar><ci type="num">x___</ci></bvar><bvar><ci type="num">b___</ci></bvar><apply type="bool"><eq></eq><apply type="num"><times></times><ci type="num">a</ci><apply type="num"><times></times><ci type="num">x</ci></apply><ci type="num">b</ci></apply><apply type="num"><times></times><ci type="num">a</ci><ci type="num">x</ci><ci type="num">b</ci></apply></apply></apply><ci type="bool">true</ci></apply><apply type="bool"><deftrue></deftrue><ci type="bool">Opposite</ci><apply type="bool"><forall></forall><bvar><ci type="num">x</ci></bvar><apply type="bool"><eq></eq><apply type="num"><plus></plus><ci type="num">x</ci><apply type="num"><minus></minus><ci type="num">x</ci></apply></apply><cn type="num">0</cn></apply></apply><ci type="bool">true</ci></apply><apply type="bool"><deftrue></deftrue><ci type="bool">defZero</ci><apply type="bool"><eq></eq><apply type="num"><plus></plus></apply><cn type="num">0</cn></apply><ci type="bool">true</ci></apply><apply type="bool"><deftrue></deftrue><ci type="bool">defOne</ci><apply type="bool"><eq></eq><apply type="num"><times></times></apply><cn type="num">1</cn></apply><ci type="bool">true</ci></apply><apply type="bool"><deftrue></deftrue><ci type="bool">propDist</ci><apply type="bool"><forall></forall><bvar><ci type="num">a</ci></bvar><bvar><ci type="num">x</ci></bvar><bvar><ci type="num">y</ci></bvar><apply type="bool"><eq></eq><apply type="num"><plus></plus><apply type="num"><times></times><ci type="num">x</ci><ci type="num">a</ci></apply><apply type="num"><times></times><ci type="num">a</ci><ci type="num">y</ci></apply></apply><apply type="num"><times></times><ci type="num">a</ci><apply type="num"><plus></plus><ci type="num">x</ci><ci type="num">y</ci></apply></apply></apply></apply><ci type="bool">true</ci></apply></apply><ci type="bool">true</ci></apply><apply type="bool"><deftrue></deftrue><ci type="bool">derived</ci><apply type="bool"><and></and><apply type="bool"><deftrue></deftrue><ci type="bool">eqPlus</ci><apply type="bool"><forall></forall><bvar><ci type="num">x</ci></bvar><bvar><ci type="num">y</ci></bvar><bvar><ci type="num">a</ci></bvar><apply type="bool"><eq></eq><apply type="bool"><eq></eq><ci type="num">x</ci><ci type="num">y</ci></apply><apply type="bool"><eq></eq><apply type="num"><plus></plus><ci type="num">x</ci><ci type="num">a</ci></apply><apply type="num"><plus></plus><ci type="num">y</ci><ci type="num">a</ci></apply></apply></apply></apply><ci type="bool">true</ci></apply><apply type="bool"><deftrue></deftrue><ci type="bool">OppositeOfOpposite</ci><apply type="bool"><forall></forall><bvar><ci type="num">x</ci></bvar><apply type="bool"><eq></eq><apply type="num"><minus></minus><apply type="num"><minus></minus><ci type="num">x</ci></apply></apply><ci type="num">x</ci></apply></apply><ci type="bool">true</ci></apply><apply type="bool"><deftrue></deftrue><ci type="bool">X_or_NotX</ci><apply type="bool"><forall></forall><bvar><ci type="bool">x</ci></bvar><apply type="bool"><or></or><ci type="bool">x</ci><apply type="bool"><not></not><ci type="bool">x</ci></apply></apply></apply><ci type="bool">true</ci></apply><apply type="bool"><deftrue></deftrue><ci type="bool">simp_timesSingleFactor</ci><apply type="bool"><forall></forall><bvar><ci type="num">x_</ci></bvar><apply type="bool"><eq></eq><apply type="num"><times></times><ci type="num">x</ci></apply><ci type="num">x</ci></apply></apply><ci type="bool">true</ci></apply><apply type="bool"><deftrue></deftrue><ci type="bool">simp_plusSingleTerm</ci><apply type="bool"><forall></forall><bvar><ci type="num">x_</ci></bvar><apply type="bool"><eq></eq><apply type="num"><plus></plus><ci type="num">x</ci></apply><ci type="num">x</ci></apply></apply><ci type="bool">true</ci></apply><apply type="bool"><deftrue></deftrue><ci type="bool">eqTimes</ci><apply type="bool"><forall></forall><bvar><ci type="num">x</ci></bvar><bvar><ci type="num">y</ci></bvar><bvar><ci type="num">a</ci></bvar><apply type="bool"><eq></eq><apply type="bool"><and></and><apply type="bool"><not></not><apply type="bool"><eq></eq><ci type="num">a</ci><cn type="num">0</cn></apply></apply><apply type="bool"><eq></eq><ci type="num">x</ci><ci type="num">y</ci></apply></apply><apply type="bool"><and></and><apply type="bool"><not></not><apply type="bool"><eq></eq><ci type="num">a</ci><cn type="num">0</cn></apply></apply><apply type="bool"><eq></eq><apply type="num"><times></times><ci type="num">a</ci><ci type="num">x</ci></apply><apply type="num"><times></times><ci type="num">a</ci><ci type="num">y</ci></apply></apply></apply></apply></apply><ci type="bool">true</ci></apply><apply type="bool"><deftrue></deftrue><ci type="bool">eqTimes2</ci><apply type="bool"><forall></forall><bvar><ci type="num">x</ci></bvar><bvar><ci type="num">y</ci></bvar><bvar><ci type="num">a</ci></bvar><apply type="bool"><eq></eq><apply type="bool"><eq></eq><ci type="num">x</ci><ci type="num">y</ci></apply><apply type="bool"><or></or><apply type="bool"><and></and><apply type="bool"><not></not><apply type="bool"><eq></eq><ci type="num">a</ci><cn type="num">0</cn></apply></apply><apply type="bool"><eq></eq><apply type="num"><times></times><ci type="num">a</ci><ci type="num">x</ci></apply><apply type="num"><times></times><ci type="num">a</ci><ci type="num">y</ci></apply></apply></apply><apply type="bool"><and></and><apply type="bool"><eq></eq><ci type="num">a</ci><cn type="num">0</cn></apply><apply type="bool"><eq></eq><ci type="num">x</ci><ci type="num">y</ci></apply></apply></apply></apply></apply><ci type="bool">true</ci></apply><apply type="bool"><deftrue></deftrue><ci type="bool">factorizeMinus</ci><apply type="bool"><forall></forall><bvar><ci type="num">x</ci></bvar><apply type="bool"><eq></eq><apply type="num"><minus></minus><ci type="num">x</ci></apply><apply type="num"><times></times><ci type="num">x</ci><apply type="num"><minus></minus><cn type="num">1</cn></apply></apply></apply></apply><ci type="bool">true</ci></apply></apply><ci type="bool">true</ci></apply></apply><ci type="bool">true</ci></apply></math>'