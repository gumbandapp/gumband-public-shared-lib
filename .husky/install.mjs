// Skip Husky install in production and CI
if (process.env.NODE_ENV === 'production' || process.env.CI === 'true') {
    console.log('Husky skipped in production or CI')
    process.exit(0)
}
const husky = (await import('husky')).default
console.log(husky())