# App Store checklist

Notes for submitting the iOS app. Apple's rules change, so check each item against the current App Store Review Guidelines.

## Must do before submitting

- [ ] **Privacy policy URL.** Apple needs a public web link. Host `PRIVACY.md` somewhere public (the GitHub repo is private, so GitHub Pages needs a public repo or a paid plan). Fill in the contact line first.
- [ ] **App Privacy ("nutrition label").** Answer **Data Not Collected**: nothing leaves the device.
- [ ] **App icon.** The app still uses the default Capacitor icon. Add a 1024×1024 icon in Xcode's asset catalog.
- [ ] **Apple Developer account** (paid yearly), a bundle id you own (currently `com.moneysim.app` in `capacitor.config.ts`) and signing set up in Xcode.
- [ ] **Screenshots** for 6.9" and 6.5" iPhones at least.
- [ ] **Content review.** Have the lessons checked by someone qualified, especially UK tax, ISA and pension figures.

## Age rating

- The app asks for a date of birth and hides the trading simulator for under-18s.
- The trading simulator and Risk Lab use virtual money only, with no real prizes, so they are not gambling. Answer "Simulated Gambling: None" unless Apple's questionnaire says otherwise for trading sims. If unsure, choose the more cautious answer.
- Expect a **4+ or 9+** rating with no real-money or user-generated content.

## Kids Category (only if you choose it)

Listing in the Kids Category is optional. If you do: no third-party analytics or ads (already true), no links out of the app without a parental gate (there are none today), and the age band (5 and under, 6–8, 9–11) must fit. Simpler: do not choose the Kids Category, and keep the general age rating.

## Wording

- Keep the "virtual money, education not financial advice" line visible (Welcome screen and Profile already have it).
- Avoid saying the app gives investment advice or predicts real prices.
