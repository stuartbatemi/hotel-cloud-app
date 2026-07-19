Download your Aiven MySQL service's CA certificate from the Aiven console
(Service overview page → "CA certificate" → Download), save it here as
`aiven-ca.pem`, and set `DB_SSL_CA_PATH=./certs/aiven-ca.pem` in your `.env`.

This file is not secret — it's a public root certificate — so it's fine to
commit it to your repository.
