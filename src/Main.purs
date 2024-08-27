module Main where

import Prelude

import Data.List (foldMap)
import Effect (Effect)
import Effect.Class.Console (logShow)
import Effect.Console (log)
import Node.Encoding (Encoding(..))
import Node.EventEmitter (once_)
import Node.HTTP.ClientRequest as Client
import Node.HTTP.IncomingMessage as IM
import Node.HTTP.OutgoingMessage as OM
import Node.HTTP.Server (closeAllConnections)
import Node.HTTP.Server as Server
import Node.HTTP.ServerResponse as ServerResponse
import Node.HTTP.Types (HttpServer', IMServer, IncomingMessage, ServerResponse)
import Node.HTTPS as HTTPS
import Node.Net.Server (listenTcp)
import Node.Net.Server as NetServer
import Node.Stream (Writable, end, pipe)
import Node.Stream as Stream
import Partial.Unsafe (unsafeCrashWith)

foreign import stdout :: forall r. Writable r

main :: Effect Unit
main = do
  server <- HTTPS.createSecureServer
  server # once_ Server.requestH (respond (killServer server))
  let netServer = Server.toNetServer server
  netServer # once_ NetServer.listeningH do
    log "Listening on port 8081."
    let
      optsR =
        { protocol: "https:"
        , method: "GET"
        , hostname: "localhost"
        , port: 8081
        , path: "/"
        , rejectUnauthorized: false
        }
    log $ optsR.method <> " " <> optsR.protocol <> "//" <> optsR.hostname <> ":" <> show optsR.port <> optsR.path <> ":"
    req <- HTTPS.requestOpts optsR
    req # once_ Client.responseH logResponse
    end (OM.toWriteable $ Client.toOutgoingMessage req)
  listenTcp netServer { host: "localhost", port: 8081 }

respond :: Effect Unit -> IncomingMessage IMServer -> ServerResponse -> Effect Unit
respond closeServer req res = do
  ServerResponse.setStatusCode 200 res
  let
    inputStream = IM.toReadable req
    om = ServerResponse.toOutgoingMessage res
    outputStream = OM.toWriteable om

  log (IM.method req <> " " <> IM.url req)
  case IM.method req of
    "GET" -> do
      let
        html = foldMap (_ <> "\n")
          [ "<form method='POST' action='/'>"
          , "  <input name='text' type='text'>"
          , "  <input type='submit'>"
          , "</form>"
          ]

      OM.setHeader "Content-Type" "text/html" om
      void $ Stream.writeString outputStream UTF8 html
      Stream.end outputStream
    "POST" ->
      pipe inputStream outputStream
    _ ->
      unsafeCrashWith "Unexpected HTTP method"

killServer :: forall transmissionType. HttpServer' transmissionType -> Effect Unit
killServer s = do
  let ns = Server.toNetServer s
  closeAllConnections s
  NetServer.close ns

logResponse :: forall imTy. IncomingMessage imTy -> Effect Unit
logResponse response = void do
  log "Headers:"
  logShow $ IM.headers response
  log "Cookies:"
  logShow $ IM.cookies response
  log "Response:"
  pipe (IM.toReadable response) stdout