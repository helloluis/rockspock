use Rack::Static, 
  :urls => ["/stylesheets", "/images", "/javascripts"],
  :root => "public"

run lambda { |env|
  [
    200, 
    {
      'Content-Type'  => 'text/html', 
      'Cache-Control' => 'public, max-age=300' 
    },
    File.open('public/index.html', File::RDONLY)
  ]
}