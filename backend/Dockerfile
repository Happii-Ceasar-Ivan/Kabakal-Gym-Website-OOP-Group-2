FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy csproj and restore as distinct layers
COPY ["KabakalGym.API/KabakalGym.API.csproj", "KabakalGym.API/"]
RUN dotnet restore "KabakalGym.API/KabakalGym.API.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/KabakalGym.API"
RUN dotnet build "KabakalGym.API.csproj" -c Release -o /app/build

# Publish
FROM build AS publish
RUN dotnet publish "KabakalGym.API.csproj" -c Release -o /app/publish

# Final runtime image
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Render dynamically sets the PORT environment variable
ENV ASPNETCORE_URLS=http://+:${PORT}

ENTRYPOINT ["dotnet", "KabakalGym.API.dll"]
