# fotodatownik

Mały amatorski projekt w node.js i Electronie.
Program służy do datowania zdjęć i albumów - ale nie poprzez ingerencję w same zdjęcia, lecz przez zmianę nazw plików i katalogów. Zmienia nazwy plików tak, aby zawierały datę i godzinę pobraną z metadanych EXIF, oraz nazwy albumów (rozumianych jako katalogi ze zdjęciami) tak, aby zawierały zakres dat wykonania zdjęć, które zawierają. Z ciekawych funkcji - program (opcjonalnie) stara się zachować tytuły/komentarze wprowadzone do nazw plików/katalogów, a także pozwala na traktowanie dnia tak, jakby zaczynał się (albo kończył) później niż o północy ;) (np. impreza kończy się o trzeciej nad ranem, technicznie rzecz biorąc jest niedziela, a my czujemy, że to właściwie jeszcze była sobota i chcemy, żeby nazwa albumu wskazywała datę sobotnią, a nie sobotnio-niedzielną).

#### Uruchamianie

Należy pobrać odpowiedni dla swojego systemu pakiet i po ewentualnym rozpakowaniu uruchomić plik `fotodatownik`. Pakiety dla Windows mają końcówkę nazwy `win.zip`, pakiet dla MacOS ma końcówkę `mac.tar.gz`, reszta to paczki dla GNU/Linux w różnych formatach.

#### Instalacja w środowisku programistycznym

* sforkować repozytorium, następnie ściągnąć na dysk (`git clone [url]; git pull`)
* zainstalować node.js
* zainstalować wymagane moduły node: w katalogu z rozpakowanym repozytorium wykonać polecenie `npm install`
* uruchomienie programu: `npm start`
* uruchomienie testów: `npm test` lub `ava` (najpierw należy usunąć uprawnienia do odczytu dla pliku `testdir/a.jpg` - jeden z testów sprawdza zachowanie funkcji czytającej EXIF w przypadku braku dostępu do pliku; mam zamiar zrobić automat do tego, podpięty do Gita przez _hooks_ - ale jeszcze tego nie zrobiłem, bo nie doczytałem o _hooks_).
* zbudowanie paczek dystrybucyjnych: `npm run dist`