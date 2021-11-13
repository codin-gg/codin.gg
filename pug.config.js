const { env: { npm_package_name: title } } = process

exports.locals = { title, i18n: {}, lang: 'en' }
