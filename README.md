# Kdo má pravdu? – soutěž (concept cartoon, automechanici)

Malý Node.js server bez dalších knihoven. Žáci se připojují přezdívkou (bez účtů), učitel hru ovládá po přihlášení heslem.

## Nasazení na Render (zdarma)

1. Vytvořte na GitHubu nový repozitář a nahrajte do něj obsah této složky
   (`server.js`, `package.json`, `tasks.json`, `render.yaml`, složku `public`).
2. Na https://render.com se přihlaste a zvolte **New → Web Service** a vyberte repozitář.
3. Nastavení:
   - Runtime: **Node**
   - Build Command: nechte prázdné nebo `echo ok`
   - Start Command: `node server.js`
   - Instance type: **Free**
4. V části **Environment** přidejte proměnnou `TEACHER_PASSWORD` s vaším heslem pro učitele.
5. Klikněte na **Create Web Service**. Po několika minutách dostanete adresu typu `https://kdo-ma-pravdu.onrender.com`.

(Alternativa: **New → Blueprint** a vybrat repozitář, použije se soubor `render.yaml`. Heslo `TEACHER_PASSWORD` pak zadáte při vytvoření.)

## Použití ve třídě

- **Žáci:** otevřou hlavní adresu (např. `https://kdo-ma-pravdu.onrender.com`), zadají jméno a čekají.
- **Učitel:** otevře `.../ucitel`, zadá heslo, v čekárně vidí připojené žáky a spustí hru.
  U každé úlohy odhalí odpověď (ukáže se správná odpověď, chyba, rozložení hlasů a pořadí) a pokračuje na další.
- **Body:** správně 500–1000 podle rychlosti (do 30 s), jinak 0. Počítá je server, žáci správné odpovědi dopředu nevidí.
- **Nová hra:** v konečném pořadí tlačítko „Nová hra“ (smaže hráče).

## Důležité u bezplatného Renderu

- Po cca 15 minutách bez provozu se služba uspí. První otevření pak trvá 30–60 s. **Otevřete stránku pár minut před hodinou.**
- Stav hry je jen v paměti. Při restartu nebo uspání serveru se hra i body vynulují. Během hodiny, kdy jsou žáci připojení, se služba neuspí.

## Lokální vyzkoušení

```
TEACHER_PASSWORD=tajne node server.js
```
Pak otevřete http://localhost:3000 (žáci) a http://localhost:3000/ucitel (učitel). Bez nastavení je heslo `ucitel`, pro ostrý provoz ho vždy změňte.

## Úpravy úloh

Úlohy jsou v `tasks.json` (zobrazená data) a také vložené do `public/index.html` (bez správných odpovědí).
Chcete-li změnit úlohy, napište mi a upravím obojí.
