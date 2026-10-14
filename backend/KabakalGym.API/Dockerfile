# Use the official .NET SDK image to build the project
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore as distinct layers
COPY ["KabakalGym.API.csproj", "./"]
RUN dotnet restore "KabakalGym.API.csproj"

# Copy everything else and build
COPY . .
RUN dotnet publish "KabakalGym.API.csproj" -c Release -o /app/publish

# Use the official .NET runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Expose port 80 for Render
EXPOSE 80

# Run the app
ENTRYPOINT ["dotnet", "KabakalGym.API.dll"]
