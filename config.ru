use Rack::Static, 
  :urls => ["/stylesheets", "/images", "/javascripts", "/sounds"],
  :root => "public"

configure do
  Rack::Mime::MIME_TYPES[".manifest"] = "text/cache-manifest"
end

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